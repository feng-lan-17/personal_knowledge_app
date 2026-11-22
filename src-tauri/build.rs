fn main() {
    let attributes = tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "storage_info",
            "db_get",
            "db_put",
            "db_all",
            "db_remove",
            "db_meta_get",
            "db_meta_set",
            "db_replace_personal",
            "sync_markdown",
            "load_markdown",
        ]),
    );
    tauri_build::try_build(attributes).expect("failed to run tauri-build");
}
