pub type AppResult<T> = Result<T, String>;

pub fn to_message<E: std::fmt::Display>(error: E) -> String {
    error.to_string()
}
