//! SQLite 存储。浏览器预览不使用这个 crate。
//! 正文同时写入 `content/{id}.md`。外部改动的文件不会自动覆盖库内正文。

use std::fs;
use std::path::{Path, PathBuf};

use rusqlite::{params, Connection};
use serde::Serialize;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use thiserror::Error;

const STORES: &[&str] = &[
    "columns",
    "topics",
    "articles",
    "documents",
    "discoveries",
    "reading",
    "highlights",
    "notes",
    "personalTopics",
    "drafts",
    "pendingBodies",
];

const PERSONAL: &[&str] = &["reading", "highlights", "notes", "personalTopics", "drafts"];

#[derive(Debug, Error)]
pub enum StoreError {
    #[error("{0}")]
    Message(String),
    #[error(transparent)]
    Sql(#[from] rusqlite::Error),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Json(#[from] serde_json::Error),
}

pub type Result<T> = std::result::Result<T, StoreError>;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoreInfo {
    pub engine: &'static str,
    pub engine_label: String,
    pub location_label: String,
    pub location_detail: String,
    pub schema_version: i32,
}

#[derive(Debug, Serialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SearchHit {
    pub article_id: String,
    pub title: String,
    pub column_id: String,
    pub snippet: String,
}

pub struct LibraryDb {
    conn: Connection,
    root: PathBuf,
}

impl LibraryDb {
    pub fn open(root: &Path) -> Result<Self> {
        fs::create_dir_all(root)?;
        fs::create_dir_all(root.join("content"))?;
        fs::create_dir_all(root.join("attachments"))?;
        fs::create_dir_all(root.join("backups"))?;
        let conn = Connection::open(root.join("library.db"))?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "foreign_keys", "ON")?;
        let db = Self {
            conn,
            root: root.to_path_buf(),
        };
        db.migrate()?;
        Ok(db)
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn info(&self) -> StoreInfo {
        StoreInfo {
            engine: "sqlite",
            engine_label: "SQLite".to_string(),
            location_label: self.root.display().to_string(),
            location_detail: "桌面版把 library.db、content 和 attachments 放在这个应用数据目录，与程序安装目录分开。直接改 Markdown 不会自动覆盖库内正文，笔记也不会被正文更新带走。浏览器预览使用 IndexedDB，不会读写这里。".to_string(),
            schema_version: 1,
        }
    }

    pub fn get(&self, store: &str, id: &str) -> Result<Option<Value>> {
        self.check_store(store)?;
        let mut stmt = self
            .conn
            .prepare("SELECT data FROM records WHERE store = ?1 AND id = ?2")?;
        let mut rows = stmt.query(params![store, id])?;
        if let Some(row) = rows.next()? {
            let data: String = row.get(0)?;
            Ok(Some(serde_json::from_str(&data)?))
        } else {
            Ok(None)
        }
    }

    pub fn put(&self, store: &str, value: &Value) -> Result<()> {
        self.check_store(store)?;
        let id = value
            .get("id")
            .and_then(Value::as_str)
            .ok_or_else(|| StoreError::Message("记录缺少 id。".into()))?;
        safe_id(id)?;
        let data = serde_json::to_string(value)?;
        self.conn.execute(
            "INSERT INTO records (store, id, data) VALUES (?1, ?2, ?3)
             ON CONFLICT(store, id) DO UPDATE SET data = excluded.data",
            params![store, id, data],
        )?;
        Ok(())
    }

    pub fn all(&self, store: &str) -> Result<Vec<Value>> {
        self.check_store(store)?;
        let mut stmt = self.conn.prepare("SELECT data FROM records WHERE store = ?1")?;
        let rows = stmt.query_map(params![store], |row| row.get::<_, String>(0))?;
        let mut out = Vec::new();
        for row in rows {
            out.push(serde_json::from_str(&row?)?);
        }
        Ok(out)
    }

    pub fn remove(&self, store: &str, id: &str) -> Result<()> {
        self.check_store(store)?;
        self.conn
            .execute("DELETE FROM records WHERE store = ?1 AND id = ?2", params![store, id])?;
        Ok(())
    }

    pub fn meta_get(&self, key: &str) -> Result<Option<String>> {
        let mut stmt = self.conn.prepare("SELECT value FROM meta WHERE key = ?1")?;
        let mut rows = stmt.query(params![key])?;
        if let Some(row) = rows.next()? {
            Ok(Some(row.get(0)?))
        } else {
            Ok(None)
        }
    }

    pub fn meta_set(&self, key: &str, value: &str) -> Result<()> {
        self.conn.execute(
            "INSERT INTO meta (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn replace_personal(&self, snapshot: &Value) -> Result<()> {
        let reading = array_field(snapshot, "reading")?;
        let highlights = array_field(snapshot, "highlights")?;
        let notes = array_field(snapshot, "notes")?;
        let topics = array_field(snapshot, "personalTopics")?;
        let drafts = array_field(snapshot, "drafts")?;
        let imported = array_field(snapshot, "imported")?;
        let prefs = snapshot
            .get("prefs")
            .cloned()
            .ok_or_else(|| StoreError::Message("备份缺少阅读偏好。".into()))?;

        let tx = self.conn.unchecked_transaction()?;
        for store in PERSONAL {
            tx.execute("DELETE FROM records WHERE store = ?1", params![store])?;
        }
        let mut canonical = std::collections::HashSet::new();
        {
            let mut stmt = tx.prepare("SELECT id, data FROM records WHERE store = 'articles'")?;
            let rows = stmt.query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)))?;
            let mut imported_ids = Vec::new();
            for row in rows {
                let (id, data) = row?;
                let value: Value = serde_json::from_str(&data)?;
                if value.get("layer").and_then(Value::as_str) == Some("canonical") {
                    canonical.insert(id);
                } else {
                    imported_ids.push(id);
                }
            }
            drop(stmt);
            for id in imported_ids {
                tx.execute(
                    "DELETE FROM records WHERE store = 'articles' AND id = ?1",
                    params![id],
                )?;
                tx.execute(
                    "DELETE FROM records WHERE store = 'documents' AND id = ?1",
                    params![id],
                )?;
            }
        }
        insert_rows(&tx, "reading", reading)?;
        insert_rows(&tx, "highlights", highlights)?;
        insert_rows(&tx, "notes", notes)?;
        insert_rows(&tx, "personalTopics", topics)?;
        insert_rows(&tx, "drafts", drafts)?;
        for item in imported {
            let article = item.get("article").cloned().unwrap_or(Value::Null);
            let body = item.get("body").and_then(Value::as_str).unwrap_or("");
            let id = article.get("id").and_then(Value::as_str).unwrap_or("").to_string();
            if id.is_empty() || canonical.contains(&id) || article.get("layer").and_then(Value::as_str) == Some("canonical")
            {
                continue;
            }
            safe_id(&id)?;
            let mut stored = article;
            stored["layer"] = json!("imported");
            stored["origin"] = json!("import");
            tx.execute(
                "INSERT INTO records (store, id, data) VALUES ('articles', ?1, ?2)",
                params![id, serde_json::to_string(&stored)?],
            )?;
            let document = json!({ "id": id, "body": body });
            tx.execute(
                "INSERT INTO records (store, id, data) VALUES ('documents', ?1, ?2)",
                params![id, serde_json::to_string(&document)?],
            )?;
        }
        tx.execute(
            "INSERT INTO meta (key, value) VALUES ('prefs', ?1)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![serde_json::to_string(&prefs)?],
        )?;
        tx.commit()?;
        Ok(())
    }

    pub fn sync_markdown(&self) -> Result<()> {
        let documents = self.all("documents")?;
        for document in documents {
            let id = document.get("id").and_then(Value::as_str).unwrap_or("");
            let body = document.get("body").and_then(Value::as_str).unwrap_or("");
            if safe_id(id).is_err() {
                continue;
            }
            let path = self.content_file(id)?;
            if !path.exists() {
                fs::write(&path, body)?;
                self.set_flag(id, false)?;
                continue;
            }
            let on_disk = fs::read_to_string(&path)?;
            let diverged = sha256_hex(&on_disk) != sha256_hex(body);
            self.set_flag(id, diverged)?;
        }
        self.rebuild_fts()?;
        Ok(())
    }

    pub fn load_markdown(&self, id: &str, confirmed: bool) -> Result<()> {
        if !confirmed {
            return Err(StoreError::Message("未确认，已取消从文件读入。数据没有改动。".into()));
        }
        safe_id(id)?;
        let path = self.content_file(id)?;
        if !path.exists() {
            return Err(StoreError::Message("没有找到对应的 Markdown 文件。".into()));
        }
        let body = fs::read_to_string(&path)?;
        let hash = sha256_hex(&body);
        self.put("documents", &json!({ "id": id, "body": body }))?;
        if let Some(mut article) = self.get("articles", id)? {
            article["bodyHash"] = json!(hash);
            article["userEdited"] = json!(true);
            article["fileDiverged"] = json!(false);
            self.put("articles", &article)?;
        }
        self.rebuild_fts()?;
        Ok(())
    }

    pub fn search_fts(&self, query: &str, column_id: Option<&str>) -> Result<Vec<SearchHit>> {
        self.rebuild_fts()?;
        let query = query.trim();
        if query.is_empty() {
            return Ok(Vec::new());
        }
        if query.chars().count() < 3 {
            return self.search_like(query, column_id);
        }
        let match_query = format!("\"{}\"", query.replace('"', "\"\""));
        let mut stmt = self.conn.prepare(
            "SELECT article_id, title, column_id, snippet(articles_fts, 3, '', '', '…', 16)
             FROM articles_fts
             WHERE articles_fts MATCH ?1 AND (?2 IS NULL OR column_id = ?2)",
        )?;
        let rows = stmt.query_map(params![match_query, column_id], |row| {
            Ok(SearchHit {
                article_id: row.get(0)?,
                title: row.get(1)?,
                column_id: row.get(2)?,
                snippet: row.get(3)?,
            })
        })?;
        let mut hits = Vec::new();
        for row in rows {
            hits.push(row?);
        }
        Ok(hits)
    }

    fn search_like(&self, query: &str, column_id: Option<&str>) -> Result<Vec<SearchHit>> {
        let pattern = format!("%{}%", query);
        let mut stmt = self.conn.prepare(
            "SELECT a.id, json_extract(a.data, '$.title'), json_extract(a.data, '$.columnId'), json_extract(d.data, '$.body')
             FROM records a
             JOIN records d ON d.store = 'documents' AND d.id = a.id
             WHERE a.store = 'articles'
               AND (?2 IS NULL OR json_extract(a.data, '$.columnId') = ?2)
               AND (json_extract(a.data, '$.title') LIKE ?1 OR json_extract(d.data, '$.body') LIKE ?1)",
        )?;
        let rows = stmt.query_map(params![pattern, column_id], |row| {
            let body: String = row.get(3)?;
            Ok(SearchHit {
                article_id: row.get(0)?,
                title: row.get(1)?,
                column_id: row.get(2)?,
                snippet: snippet_of(&body, query),
            })
        })?;
        let mut hits = Vec::new();
        for row in rows {
            hits.push(row?);
        }
        Ok(hits)
    }

    fn rebuild_fts(&self) -> Result<()> {
        self.conn.execute("DELETE FROM articles_fts", [])?;
        self.conn.execute(
            "INSERT INTO articles_fts(article_id, column_id, title, body)
             SELECT a.id,
                    json_extract(a.data, '$.columnId'),
                    json_extract(a.data, '$.title'),
                    json_extract(d.data, '$.body')
             FROM records a
             JOIN records d ON d.store = 'documents' AND d.id = a.id
             WHERE a.store = 'articles'",
            [],
        )?;
        Ok(())
    }

    fn set_flag(&self, id: &str, diverged: bool) -> Result<()> {
        let Some(mut article) = self.get("articles", id)? else {
            return Ok(());
        };
        article["fileDiverged"] = json!(diverged);
        self.put("articles", &article)
    }

    fn content_file(&self, id: &str) -> Result<PathBuf> {
        safe_id(id)?;
        Ok(self.root.join("content").join(format!("{id}.md")))
    }

    fn migrate(&self) -> Result<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS records (
                store TEXT NOT NULL,
                id TEXT NOT NULL,
                data TEXT NOT NULL,
                PRIMARY KEY (store, id)
             );
             CREATE TABLE IF NOT EXISTS meta (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
             );
             CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
                article_id UNINDEXED,
                column_id UNINDEXED,
                title,
                body,
                tokenize = 'trigram'
             );",
        )?;
        Ok(())
    }

    fn check_store(&self, store: &str) -> Result<()> {
        if STORES.contains(&store) {
            Ok(())
        } else {
            Err(StoreError::Message(format!("未知的数据表：{store}")))
        }
    }
}

fn insert_rows(tx: &Connection, store: &str, rows: &[Value]) -> Result<()> {
    for row in rows {
        let id = row.get("id").and_then(Value::as_str).unwrap_or("");
        if id.is_empty() {
            continue;
        }
        safe_id(id)?;
        tx.execute(
            "INSERT INTO records (store, id, data) VALUES (?1, ?2, ?3)",
            params![store, id, serde_json::to_string(row)?],
        )?;
    }
    Ok(())
}

fn array_field<'a>(value: &'a Value, key: &str) -> Result<&'a Vec<Value>> {
    value
        .get(key)
        .and_then(Value::as_array)
        .ok_or_else(|| StoreError::Message(format!("{key} 应该是数组。")))
}

pub fn safe_id(id: &str) -> Result<()> {
    let ok = !id.is_empty()
        && id.len() <= 80
        && id.chars().all(|ch| ch.is_ascii_lowercase() || ch.is_ascii_digit() || ch == '-')
        && !id.contains("..")
        && !id.starts_with('-');
    if ok {
        Ok(())
    } else {
        Err(StoreError::Message(format!("拒绝不安全的标识：{id}")))
    }
}

fn sha256_hex(text: &str) -> String {
    let digest = Sha256::digest(text.as_bytes());
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn snippet_of(body: &str, query: &str) -> String {
    let lower = body.to_lowercase();
    let index = lower.find(&query.to_lowercase()).unwrap_or(0);
    let mut start = index.saturating_sub(12);
    while start > 0 && !body.is_char_boundary(start) {
        start -= 1;
    }
    let mut end = (index + query.len() + 24).min(body.len());
    while end < body.len() && !body.is_char_boundary(end) {
        end += 1;
    }
    body[start..end].trim().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn temp_db() -> (PathBuf, LibraryDb) {
        let path = std::env::temp_dir().join(format!(
            "pkl-store-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let db = LibraryDb::open(&path).unwrap();
        (path, db)
    }

    fn article(id: &str, title: &str, layer: &str) -> Value {
        json!({
            "id": id,
            "columnId": "llm",
            "layer": layer,
            "title": title,
            "fileDiverged": false,
            "userEdited": false,
            "bodyHash": ""
        })
    }

    #[test]
    fn fts_finds_chinese_and_keeps_column() {
        let (_dir, db) = temp_db();
        db.put("articles", &article("llm-note", "注意力笔记", "canonical")).unwrap();
        db.put("documents", &json!({"id": "llm-note", "body": "注意力机制用来给上下文加权。"})).unwrap();
        db.put("articles", &article("gs-note", "高斯", "canonical")).unwrap();
        db.put("documents", &json!({"id": "gs-note", "body": "协方差描述椭球。"})).unwrap();
        let hits = db.search_fts("注意力", None).unwrap();
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].article_id, "llm-note");
        assert!(hits[0].snippet.contains("注意力") || hits[0].title.contains("注意力"));
        assert!(db.search_fts("注意力", Some("gs")).unwrap().is_empty());
    }

    #[test]
    fn file_edit_does_not_replace_body_or_notes_until_confirmed() {
        let (_dir, db) = temp_db();
        db.put("articles", &article("llm-note", "注意力笔记", "canonical")).unwrap();
        db.put("documents", &json!({"id": "llm-note", "body": "库内原文"})).unwrap();
        db.put("notes", &json!({"id": "n1", "articleId": "llm-note", "body": "我的笔记"})).unwrap();
        db.sync_markdown().unwrap();
        fs::write(db.content_file("llm-note").unwrap(), "磁盘上被改过的正文").unwrap();
        db.sync_markdown().unwrap();
        let document = db.get("documents", "llm-note").unwrap().unwrap();
        assert_eq!(document["body"], "库内原文");
        let note = db.get("notes", "n1").unwrap().unwrap();
        assert_eq!(note["body"], "我的笔记");
        let article = db.get("articles", "llm-note").unwrap().unwrap();
        assert_eq!(article["fileDiverged"], true);
        assert!(db.load_markdown("llm-note", false).is_err());
        assert_eq!(db.get("documents", "llm-note").unwrap().unwrap()["body"], "库内原文");
        db.load_markdown("llm-note", true).unwrap();
        assert_eq!(db.get("documents", "llm-note").unwrap().unwrap()["body"], "磁盘上被改过的正文");
        assert_eq!(db.get("notes", "n1").unwrap().unwrap()["body"], "我的笔记");
    }

    #[test]
    fn replace_personal_skips_canonical_and_rejects_bad_paths() {
        let (_dir, db) = temp_db();
        db.put("articles", &article("llm-note", "教材", "canonical")).unwrap();
        db.put("documents", &json!({"id": "llm-note", "body": "教材正文"})).unwrap();
        db.put("notes", &json!({"id": "old", "body": "旧笔记"})).unwrap();
        let snapshot = json!({
            "reading": [],
            "highlights": [],
            "notes": [{"id": "new", "body": "新笔记"}],
            "personalTopics": [],
            "drafts": [],
            "prefs": {"theme": "paper"},
            "imported": [{
                "article": {"id": "llm-note", "title": "冒充", "layer": "imported"},
                "body": "不该覆盖"
            }, {
                "article": {"id": "import-note", "title": "导入", "layer": "imported"},
                "body": "导入正文"
            }]
        });
        db.replace_personal(&snapshot).unwrap();
        assert_eq!(db.get("documents", "llm-note").unwrap().unwrap()["body"], "教材正文");
        assert_eq!(db.get("articles", "llm-note").unwrap().unwrap()["layer"], "canonical");
        assert_eq!(db.get("notes", "old").unwrap(), None);
        assert_eq!(db.get("notes", "new").unwrap().unwrap()["body"], "新笔记");
        assert_eq!(db.get("documents", "import-note").unwrap().unwrap()["body"], "导入正文");
        assert!(safe_id("../secret").is_err());
        assert!(db.put("documents", &json!({"id": "../secret", "body": "no"})).is_err());
    }
}
