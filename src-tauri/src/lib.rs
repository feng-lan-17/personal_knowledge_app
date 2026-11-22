use std::sync::Mutex;

use pkl_store::LibraryDb;
use serde_json::Value;
use tauri::Manager;
use tauri::State;

struct AppState {
    db: Mutex<LibraryDb>,
}

fn lock<'a>(state: &'a State<'_, AppState>) -> Result<std::sync::MutexGuard<'a, LibraryDb>, String> {
    state.db.lock().map_err(|error| error.to_string())
}

#[tauri::command]
fn storage_info(state: State<AppState>) -> Result<pkl_store::StoreInfo, String> {
    Ok(lock(&state)?.info())
}

#[tauri::command]
fn db_get(state: State<AppState>, table: String, id: String) -> Result<Option<Value>, String> {
    lock(&state)?.get(&table, &id).map_err(|error| error.to_string())
}

#[tauri::command]
fn db_put(state: State<AppState>, table: String, value: Value) -> Result<(), String> {
    lock(&state)?.put(&table, &value).map_err(|error| error.to_string())
}

#[tauri::command]
fn db_all(state: State<AppState>, table: String) -> Result<Vec<Value>, String> {
    lock(&state)?.all(&table).map_err(|error| error.to_string())
}

#[tauri::command]
fn db_remove(state: State<AppState>, table: String, id: String) -> Result<(), String> {
    lock(&state)?.remove(&table, &id).map_err(|error| error.to_string())
}

#[tauri::command]
fn db_meta_get(state: State<AppState>, key: String) -> Result<Option<String>, String> {
    lock(&state)?.meta_get(&key).map_err(|error| error.to_string())
}

#[tauri::command]
fn db_meta_set(state: State<AppState>, key: String, value: String) -> Result<(), String> {
    lock(&state)?.meta_set(&key, &value).map_err(|error| error.to_string())
}

#[tauri::command]
fn db_replace_personal(state: State<AppState>, snapshot: Value) -> Result<(), String> {
    lock(&state)?.replace_personal(&snapshot).map_err(|error| error.to_string())
}

#[tauri::command]
fn sync_markdown(state: State<AppState>) -> Result<(), String> {
    lock(&state)?.sync_markdown().map_err(|error| error.to_string())
}

#[tauri::command]
fn load_markdown(state: State<AppState>, id: String, confirmed: bool) -> Result<(), String> {
    lock(&state)?
        .load_markdown(&id, confirmed)
        .map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&dir)?;
            let db = LibraryDb::open(&dir)?;
            app.manage(AppState { db: Mutex::new(db) });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            storage_info,
            db_get,
            db_put,
            db_all,
            db_remove,
            db_meta_get,
            db_meta_set,
            db_replace_personal,
            sync_markdown,
            load_markdown
        ])
        .run(tauri::generate_context!())
        .expect("启动私人知识图书馆失败");
}
