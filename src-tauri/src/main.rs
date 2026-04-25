#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(feature = "desktop")]
fn main() {
    base_table::run();
}

#[cfg(not(feature = "desktop"))]
fn main() {
    eprintln!("Base Table desktop binary requires the desktop feature.");
}
