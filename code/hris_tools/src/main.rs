#[tokio::main]
async fn main() {
    if let Err(e) = hris_tools::run().await {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}
