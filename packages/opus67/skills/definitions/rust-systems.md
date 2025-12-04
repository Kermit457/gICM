# Rust Systems Engineer

> **ID:** `rust-systems`
> **Tier:** 1
> **Token Cost:** 10000
> **MCP Connections:** None

## 🎯 What This Skill Does

- Write memory-safe systems code without garbage collection
- Implement zero-copy parsing and serialization
- Build async applications with Tokio runtime
- Optimize for performance with profiling and benchmarking
- Master ownership, borrowing, and lifetime annotations
- Architect cargo workspaces for complex projects

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** rust, cargo, unsafe, lifetime, borrow, tokio, async, zero-copy
- **File Types:** .rs, Cargo.toml
- **Directories:** src/, crates/

## 🚀 Core Capabilities

### 1. Write Memory-Safe Systems Code

Leveraging Rust's ownership system to eliminate entire classes of bugs at compile time.

**Best Practices:**
- Let the borrow checker guide you - fight it less, learn from it more
- Use `Result<T, E>` for recoverable errors, `panic!` for unrecoverable ones
- Prefer borrowing (`&T`) over cloning when possible
- Use `Cow<'a, T>` for copy-on-write scenarios
- Leverage newtypes for type safety (zero runtime cost)

**Common Patterns:**

```rust
// Newtype Pattern - Zero-cost abstraction
#[derive(Debug, Clone, Copy)]
pub struct UserId(u64);

#[derive(Debug, Clone, Copy)]
pub struct PostId(u64);

// Compile-time prevention of mixing IDs
fn get_user(id: UserId) -> Option<User> {
    // Cannot pass PostId here
    database.users.get(id.0)
}

// Smart Constructor Pattern - Enforce invariants
pub struct Email(String);

impl Email {
    pub fn new(email: String) -> Result<Self, EmailError> {
        if email.contains('@') && email.len() > 3 {
            Ok(Email(email))
        } else {
            Err(EmailError::Invalid)
        }
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

// Now Email can only be constructed if valid
fn send_email(to: Email, subject: &str, body: &str) {
    // We know `to` is a valid email
}

// Error Handling with ? operator and Result
use std::fs::File;
use std::io::{self, Read};

fn read_config() -> Result<String, io::Error> {
    let mut file = File::open("config.toml")?; // Propagates error
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

// Custom Error Types with thiserror
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("I/O error: {0}")]
    Io(#[from] io::Error),

    #[error("User not found: {user_id}")]
    UserNotFound { user_id: String },

    #[error("Invalid input: {0}")]
    Validation(String),
}

// Using Result with custom errors
fn create_user(email: String) -> Result<User, AppError> {
    let email = Email::new(email)
        .map_err(|e| AppError::Validation(format!("{:?}", e)))?;

    let user = db.insert_user(email)?; // Auto-converts sqlx::Error
    Ok(user)
}

// Option Combinators - Avoid nested ifs
fn find_user_email(user_id: u64) -> Option<String> {
    users
        .get(&user_id)?
        .email
        .as_ref()?
        .clone()
}

// Interior Mutability - Mutate through shared reference
use std::cell::RefCell;
use std::rc::Rc;

struct Cache {
    data: RefCell<HashMap<String, String>>,
}

impl Cache {
    fn get(&self, key: &str) -> Option<String> {
        self.data.borrow().get(key).cloned()
    }

    fn insert(&self, key: String, value: String) {
        self.data.borrow_mut().insert(key, value);
    }
}

// Thread-safe interior mutability
use std::sync::{Arc, Mutex, RwLock};

#[derive(Clone)]
struct SharedState {
    counter: Arc<Mutex<u64>>,
    cache: Arc<RwLock<HashMap<String, String>>>,
}

impl SharedState {
    fn increment(&self) {
        let mut counter = self.counter.lock().unwrap();
        *counter += 1;
    }

    fn read_cache(&self, key: &str) -> Option<String> {
        self.cache.read().unwrap().get(key).cloned()
    }

    fn write_cache(&self, key: String, value: String) {
        self.cache.write().unwrap().insert(key, value);
    }
}
```

**Gotchas:**
- `Rc<T>` is not thread-safe, use `Arc<T>` for multi-threading
- `RefCell<T>` panics on borrow rule violations at runtime
- Mutex guards can deadlock if not carefully managed
- Interior mutability has runtime overhead

### 2. Implement Zero-Copy Parsing

Avoiding allocations by borrowing from the input buffer.

**Best Practices:**
- Use `&str` instead of `String` when you don't need ownership
- Leverage `Cow<'a, str>` for conditional cloning
- Parse in-place with libraries like `nom` or `winnow`
- Use `bytes::Bytes` for reference-counted byte buffers

**Common Patterns:**

```rust
// Zero-copy string parsing
fn parse_key_value(input: &str) -> Option<(&str, &str)> {
    let mut parts = input.split('=');
    let key = parts.next()?;
    let value = parts.next()?;
    Some((key.trim(), value.trim()))
}

// No allocations! Returns references into input
let (key, value) = parse_key_value("name=Alice").unwrap();

// Cow - Clone on write
use std::borrow::Cow;

fn normalize_path(path: &str) -> Cow<str> {
    if path.contains('\\') {
        // Allocate only if modification needed
        Cow::Owned(path.replace('\\', "/"))
    } else {
        // Borrow if no changes needed
        Cow::Borrowed(path)
    }
}

// Efficient use
let path1 = normalize_path("/home/user"); // Borrowed
let path2 = normalize_path("C:\\Users"); // Owned

// nom - Zero-copy parser combinators
use nom::{
    IResult,
    bytes::complete::{tag, take_while1},
    character::complete::{digit1, space0},
    sequence::tuple,
};

fn parse_user(input: &str) -> IResult<&str, User> {
    let (input, (id, _, name)) = tuple((
        digit1,
        space0,
        take_while1(|c: char| c.is_alphabetic()),
    ))(input)?;

    Ok((input, User {
        id: id.parse().unwrap(),
        name: name.to_string(), // Only allocation
    }))
}

// bytes::Bytes - Reference-counted byte buffers
use bytes::{Bytes, BytesMut, Buf};

fn parse_frame(data: Bytes) -> Frame {
    let mut buf = data.clone(); // Cheap: just increments refcount
    let header = buf.get_u32();
    let body = buf.slice(..); // Zero-copy slice
    Frame { header, body }
}

// Slicing with lifetimes
struct Parser<'a> {
    input: &'a [u8],
    pos: usize,
}

impl<'a> Parser<'a> {
    fn new(input: &'a [u8]) -> Self {
        Parser { input, pos: 0 }
    }

    fn take(&mut self, n: usize) -> Option<&'a [u8]> {
        if self.pos + n <= self.input.len() {
            let slice = &self.input[self.pos..self.pos + n];
            self.pos += n;
            Some(slice)
        } else {
            None
        }
    }

    fn remaining(&self) -> &'a [u8] {
        &self.input[self.pos..]
    }
}

// Serde with zero-copy deserialization
use serde::Deserialize;

#[derive(Deserialize)]
struct Message<'a> {
    #[serde(borrow)]
    command: &'a str,
    #[serde(borrow)]
    payload: &'a str,
}

// Deserializes without allocating strings
let msg: Message = serde_json::from_str(r#"{"command":"ping","payload":"data"}"#)?;
```

**Gotchas:**
- Lifetime annotations can get complex with multiple borrows
- Zero-copy only works if the source buffer outlives all references
- `Cow` can be confusing - use sparingly and document
- `bytes::Bytes` is great for I/O but has overhead for small buffers

### 3. Handle Async with Tokio

Building high-performance concurrent applications with async/await.

**Best Practices:**
- Use `tokio::spawn` for CPU-bound tasks in `spawn_blocking`
- Prefer channels (`mpsc`, `broadcast`) over shared state
- Use `tokio::select!` for cancellation and timeouts
- Leverage `Arc` to share state between tasks
- Stream data with `tokio::io::AsyncRead` and `AsyncWrite`

**Common Patterns:**

```rust
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::{TcpListener, TcpStream},
    sync::{mpsc, oneshot, Mutex},
    time::{sleep, Duration, timeout},
};
use std::sync::Arc;

// Basic async function
async fn fetch_user(id: u64) -> Result<User, AppError> {
    let response = reqwest::get(&format!("https://api.example.com/users/{}", id))
        .await?
        .json::<User>()
        .await?;
    Ok(response)
}

// Concurrent execution with join!
use tokio::join;

async fn load_dashboard() -> Result<Dashboard, AppError> {
    let (users, posts, stats) = join!(
        fetch_users(),
        fetch_posts(),
        fetch_stats(),
    );

    Ok(Dashboard {
        users: users?,
        posts: posts?,
        stats: stats?,
    })
}

// Spawn background tasks
#[tokio::main]
async fn main() {
    let handle = tokio::spawn(async {
        // Runs on separate task
        fetch_user(123).await
    });

    // Wait for completion
    let result = handle.await.unwrap();
}

// CPU-bound work with spawn_blocking
async fn process_image(image: Vec<u8>) -> Result<Vec<u8>, AppError> {
    let result = tokio::task::spawn_blocking(move || {
        // Runs on dedicated thread pool
        expensive_image_processing(image)
    })
    .await??;

    Ok(result)
}

// Channels for communication
async fn producer_consumer_pattern() {
    let (tx, mut rx) = mpsc::channel::<String>(100);

    // Producer task
    tokio::spawn(async move {
        for i in 0..10 {
            tx.send(format!("message {}", i)).await.unwrap();
        }
    });

    // Consumer task
    tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            println!("Received: {}", msg);
        }
    });
}

// Select for cancellation and timeouts
async fn fetch_with_timeout(url: &str) -> Result<String, AppError> {
    tokio::select! {
        result = reqwest::get(url) => {
            let text = result?.text().await?;
            Ok(text)
        }
        _ = sleep(Duration::from_secs(5)) => {
            Err(AppError::Timeout)
        }
    }
}

// Graceful shutdown
async fn server_with_shutdown(shutdown_rx: oneshot::Receiver<()>) {
    let listener = TcpListener::bind("127.0.0.1:8080").await.unwrap();

    tokio::select! {
        _ = async {
            loop {
                let (socket, _) = listener.accept().await.unwrap();
                tokio::spawn(handle_connection(socket));
            }
        } => {}
        _ = shutdown_rx => {
            println!("Shutting down gracefully");
        }
    }
}

// Shared state with Arc + Mutex
#[derive(Clone)]
struct AppState {
    db: Arc<Database>,
    cache: Arc<Mutex<HashMap<String, String>>>,
}

async fn handle_request(state: AppState, req: Request) -> Response {
    // Check cache first
    {
        let cache = state.cache.lock().await;
        if let Some(cached) = cache.get(&req.key) {
            return Response::from_cache(cached.clone());
        }
    }

    // Query database
    let result = state.db.query(&req.key).await?;

    // Update cache
    {
        let mut cache = state.cache.lock().await;
        cache.insert(req.key.clone(), result.clone());
    }

    Response::new(result)
}

// Streaming with AsyncRead/AsyncWrite
use tokio::io;

async fn proxy_connection(
    mut client: TcpStream,
    mut server: TcpStream,
) -> io::Result<()> {
    let (mut client_read, mut client_write) = client.split();
    let (mut server_read, mut server_write) = server.split();

    tokio::select! {
        result = io::copy(&mut client_read, &mut server_write) => result?,
        result = io::copy(&mut server_read, &mut client_write) => result?,
    };

    Ok(())
}

// Stream processing with futures::Stream
use futures::stream::{self, StreamExt};

async fn process_stream() {
    let items = stream::iter(0..100)
        .map(|i| async move {
            // Async transformation
            sleep(Duration::from_millis(10)).await;
            i * 2
        })
        .buffer_unordered(10) // Process 10 at a time
        .collect::<Vec<_>>()
        .await;

    println!("Processed {} items", items.len());
}
```

**Gotchas:**
- Tokio runtime must be running to execute async code
- `Mutex` from `tokio::sync` is async-aware, `std::sync::Mutex` is not
- Holding a `MutexGuard` across `.await` can deadlock
- `spawn_blocking` creates real threads - limit usage

### 4. Optimize for Performance

Systematic profiling and optimization techniques.

**Best Practices:**
- Measure before optimizing - use `cargo bench` and `criterion`
- Profile with `perf`, `flamegraph`, or `cargo-instruments`
- Use `cargo bloat` to analyze binary size
- Leverage `#[inline]` and `#[cold]` hints strategically
- Enable LTO and codegen-units=1 for release builds

**Common Patterns:**

```rust
// Benchmarking with Criterion
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn fibonacci_slow(n: u64) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        n => fibonacci_slow(n - 1) + fibonacci_slow(n - 2),
    }
}

fn fibonacci_fast(n: u64) -> u64 {
    let mut a = 0;
    let mut b = 1;
    for _ in 0..n {
        let tmp = a;
        a = b;
        b = tmp + b;
    }
    a
}

fn benchmark_fibonacci(c: &mut Criterion) {
    c.bench_function("fib 20 slow", |b| {
        b.iter(|| fibonacci_slow(black_box(20)))
    });

    c.bench_function("fib 20 fast", |b| {
        b.iter(|| fibonacci_fast(black_box(20)))
    });
}

criterion_group!(benches, benchmark_fibonacci);
criterion_main!(benches);

// Inline hints for hot paths
#[inline]
pub fn fast_path(x: u64) -> u64 {
    x.wrapping_mul(2).wrapping_add(1)
}

#[inline(always)] // Force inline
pub fn critical_hot_loop(data: &[u8]) -> u32 {
    data.iter().fold(0u32, |acc, &b| acc.wrapping_add(b as u32))
}

#[cold] // Mark as unlikely (for error paths)
fn handle_error(err: &str) {
    eprintln!("ERROR: {}", err);
}

// SIMD for data-parallel operations
use std::arch::x86_64::*;

#[target_feature(enable = "avx2")]
unsafe fn sum_avx2(data: &[f32]) -> f32 {
    // SIMD vectorized sum
    // ... AVX2 intrinsics
    0.0 // Placeholder
}

// Zero-allocation string building
use std::fmt::Write;

fn build_response() -> String {
    let mut response = String::with_capacity(1024);
    write!(response, "HTTP/1.1 200 OK\r\n").unwrap();
    write!(response, "Content-Type: application/json\r\n").unwrap();
    write!(response, "\r\n{{}}").unwrap();
    response
}

// Reuse allocations with object pools
use std::cell::RefCell;

thread_local! {
    static BUFFER_POOL: RefCell<Vec<Vec<u8>>> = RefCell::new(Vec::new());
}

fn get_buffer() -> Vec<u8> {
    BUFFER_POOL.with(|pool| {
        pool.borrow_mut().pop().unwrap_or_else(|| Vec::with_capacity(4096))
    })
}

fn return_buffer(mut buf: Vec<u8>) {
    buf.clear();
    BUFFER_POOL.with(|pool| {
        if pool.borrow().len() < 16 {
            pool.borrow_mut().push(buf);
        }
    });
}

// Profile-guided optimization in Cargo.toml
// [profile.release]
// lto = "fat"              # Full LTO
// codegen-units = 1        # Single codegen unit for better optimization
// opt-level = 3            # Maximum optimization
// strip = true             # Strip symbols
```

**Gotchas:**
- `#[inline(always)]` can increase binary size and hurt performance
- SIMD requires target feature checks and unsafe code
- LTO significantly increases compile time
- Benchmarking requires stable system state (disable turbo boost)

### 5. Manage Lifetimes and Borrowing

Advanced lifetime patterns for complex data structures.

**Best Practices:**
- Let the compiler infer lifetimes when possible
- Use named lifetimes for clarity in complex scenarios
- Prefer `'static` for data that lives for program duration
- Use lifetime elision rules to simplify signatures
- Document lifetime relationships in comments

**Common Patterns:**

```rust
// Basic lifetime annotation
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

// Multiple lifetimes
struct Context<'a, 'b> {
    config: &'a Config,
    cache: &'b mut Cache,
}

impl<'a, 'b> Context<'a, 'b> {
    fn process(&mut self, data: &str) -> Result<(), Error> {
        // Can use both config and cache
        Ok(())
    }
}

// Lifetime bounds on generics
fn process_items<'a, T>(items: &'a [T]) -> Vec<&'a T>
where
    T: 'a + Clone,
{
    items.iter().filter(|item| is_valid(item)).collect()
}

// Self-referential structs (requires Pin)
use std::pin::Pin;
use std::marker::PhantomPinned;

struct SelfReferential {
    data: String,
    pointer: *const String,
    _pin: PhantomPinned,
}

impl SelfReferential {
    fn new(data: String) -> Pin<Box<Self>> {
        let mut boxed = Box::pin(SelfReferential {
            data,
            pointer: std::ptr::null(),
            _pin: PhantomPinned,
        });

        let ptr = &boxed.data as *const String;
        unsafe {
            let mut_ref = Pin::as_mut(&mut boxed);
            Pin::get_unchecked_mut(mut_ref).pointer = ptr;
        }

        boxed
    }
}

// Higher-ranked trait bounds (HRTB)
fn apply_to_all<F>(items: &[String], f: F)
where
    F: for<'a> Fn(&'a str) -> usize,
{
    for item in items {
        let len = f(item);
        println!("Length: {}", len);
    }
}

// Usage: F works for any lifetime
apply_to_all(&vec!["a".to_string(), "b".to_string()], |s| s.len());

// Lifetime elision in action
// Explicit:
fn first_word<'a>(s: &'a str) -> &'a str {
    s.split_whitespace().next().unwrap_or("")
}

// Elided (compiler infers):
fn first_word(s: &str) -> &str {
    s.split_whitespace().next().unwrap_or("")
}

// Static lifetime for global data
static CONFIG: &str = "production";

fn get_config() -> &'static str {
    CONFIG
}

// Leaked references (careful!)
fn leak_string(s: String) -> &'static str {
    Box::leak(s.into_boxed_str())
}
```

**Gotchas:**
- Lifetime elision works in ~90% of cases
- `'static` means "lives forever", not "is immutable"
- Self-referential structs require `Pin` and are tricky
- HRTB syntax (`for<'a>`) is rare but powerful

### 6. Build with Cargo Workspaces

Organizing large Rust projects with multiple crates.

**Best Practices:**
- Split code into focused, single-purpose crates
- Use workspace dependencies to share versions
- Create a `xtask` crate for project automation
- Leverage feature flags for conditional compilation
- Use `cargo-make` or `just` for complex workflows

**Common Patterns:**

```toml
# Root Cargo.toml
[workspace]
members = [
    "crates/core",
    "crates/api",
    "crates/cli",
    "xtask",
]
resolver = "2"

[workspace.dependencies]
# Shared dependencies across workspace
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
anyhow = "1.0"

[workspace.metadata.release]
# Coordinated releases
allow-branch = ["main"]
tag-prefix = "v"

# crates/core/Cargo.toml
[package]
name = "myapp-core"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { workspace = true }
serde = { workspace = true }

[features]
default = ["std"]
std = []
no-std = []

# crates/api/Cargo.toml
[package]
name = "myapp-api"
version = "0.1.0"
edition = "2021"

[dependencies]
myapp-core = { path = "../core" }
tokio = { workspace = true }
axum = "0.7"

# xtask/Cargo.toml (automation)
[package]
name = "xtask"
version = "0.1.0"
edition = "2021"

[dependencies]
clap = "4.0"
```

```rust
// xtask/src/main.rs - Project automation
use std::process::Command;

fn main() -> anyhow::Result<()> {
    let task = std::env::args().nth(1);
    match task.as_deref() {
        Some("dist") => dist()?,
        Some("ci") => ci()?,
        _ => print_help(),
    }
    Ok(())
}

fn dist() -> anyhow::Result<()> {
    run_cmd("cargo", &["build", "--release"])?;
    run_cmd("cargo", &["test", "--release"])?;
    println!("✓ Distribution build complete");
    Ok(())
}

fn ci() -> anyhow::Result<()> {
    run_cmd("cargo", &["fmt", "--", "--check"])?;
    run_cmd("cargo", &["clippy", "--", "-D", "warnings"])?;
    run_cmd("cargo", &["test", "--all"])?;
    println!("✓ CI checks passed");
    Ok(())
}

fn run_cmd(cmd: &str, args: &[&str]) -> anyhow::Result<()> {
    let status = Command::new(cmd).args(args).status()?;
    if !status.success() {
        anyhow::bail!("Command failed: {} {:?}", cmd, args);
    }
    Ok(())
}

// Run with: cargo xtask dist
```

**Gotchas:**
- Workspace dependencies must use the same features across crates
- Cyclic dependencies between crates are not allowed
- `cargo publish` doesn't automatically publish workspace members
- Feature unification can cause dependency bloat

## 💡 Real-World Examples

### Example 1: High-Performance Web Server

```rust
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, postgres::PgPoolOptions};
use std::sync::Arc;
use tokio::net::TcpListener;

#[derive(Clone)]
struct AppState {
    db: PgPool,
}

#[derive(Serialize, Deserialize)]
struct User {
    id: i64,
    email: String,
    name: String,
}

async fn get_user(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
) -> Result<Json<User>, StatusCode> {
    let user = sqlx::query_as!(
        User,
        "SELECT id, email, name FROM users WHERE id = $1",
        id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(Json(user))
}

async fn create_user(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<User>,
) -> Result<Json<User>, StatusCode> {
    let user = sqlx::query_as!(
        User,
        "INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id, email, name",
        payload.email,
        payload.name
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(user))
}

#[tokio::main]
async fn main() {
    let db = PgPoolOptions::new()
        .max_connections(20)
        .connect("postgres://localhost/myapp")
        .await
        .expect("Failed to connect to database");

    let state = Arc::new(AppState { db });

    let app = Router::new()
        .route("/users/:id", get(get_user))
        .route("/users", post(create_user))
        .with_state(state);

    let listener = TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Server running on http://localhost:3000");

    axum::serve(listener, app).await.unwrap();
}
```

### Example 2: Solana Program (Anchor-style)

```rust
use anchor_lang::prelude::*;

declare_id!("YourProgramIDHere111111111111111111111111111");

#[program]
pub mod token_swap {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, bump: u8) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.token_a_reserve = 0;
        pool.token_b_reserve = 0;
        pool.bump = bump;
        Ok(())
    }

    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        minimum_amount_out: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        // Calculate swap
        let amount_out = calculate_swap_amount(
            amount_in,
            pool.token_a_reserve,
            pool.token_b_reserve,
        )?;

        require!(
            amount_out >= minimum_amount_out,
            ErrorCode::SlippageExceeded
        );

        // Update reserves
        pool.token_a_reserve = pool
            .token_a_reserve
            .checked_add(amount_in)
            .ok_or(ErrorCode::Overflow)?;

        pool.token_b_reserve = pool
            .token_b_reserve
            .checked_sub(amount_out)
            .ok_or(ErrorCode::InsufficientLiquidity)?;

        // Emit event
        emit!(SwapEvent {
            user: ctx.accounts.user.key(),
            amount_in,
            amount_out,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Pool::LEN,
        seeds = [b"pool"],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(
        mut,
        seeds = [b"pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub user: Signer<'info>,
}

#[account]
pub struct Pool {
    pub authority: Pubkey,
    pub token_a_reserve: u64,
    pub token_b_reserve: u64,
    pub bump: u8,
}

impl Pool {
    pub const LEN: usize = 32 + 8 + 8 + 1;
}

#[event]
pub struct SwapEvent {
    pub user: Pubkey,
    pub amount_in: u64,
    pub amount_out: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
}

fn calculate_swap_amount(
    amount_in: u64,
    reserve_in: u64,
    reserve_out: u64,
) -> Result<u64> {
    let numerator = (amount_in as u128)
        .checked_mul(reserve_out as u128)
        .ok_or(ErrorCode::Overflow)?;

    let denominator = (reserve_in as u128)
        .checked_add(amount_in as u128)
        .ok_or(ErrorCode::Overflow)?;

    let amount_out = numerator
        .checked_div(denominator)
        .ok_or(ErrorCode::Overflow)?;

    u64::try_from(amount_out).map_err(|_| ErrorCode::Overflow.into())
}
```

## 🔗 Related Skills

- **solana-anchor-expert** - Rust for Solana programs
- **typescript-senior** - Type system parallels
- **bonding-curve-master** - Rust implementation of AMM math
- **nextjs-14-expert** - Rust for backend APIs

## 📖 Further Reading

- [The Rust Programming Language Book](https://doc.rust-lang.org/book/)
- [Rust Async Book](https://rust-lang.github.io/async-book/)
- [Tokio Tutorial](https://tokio.rs/tokio/tutorial)
- [Rust Performance Book](https://nnethercote.github.io/perf-book/)
- [Effective Rust](https://www.lurklurk.org/effective-rust/)
- [Crust of Rust (Jon Gjengset)](https://www.youtube.com/c/JonGjengset)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
