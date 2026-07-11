#[tokio::main]
async fn main() {
    if let Err(e) = dl_hire::run().await {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}
