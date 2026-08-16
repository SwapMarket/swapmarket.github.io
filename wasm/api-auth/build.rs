use rand::Rng;
use std::env;
use std::fs;
use std::path::Path;

// cargo doesn't rerun this for env vars it's never seen before, so the npm
// build script runs "cargo clean" ahead of every build to force it
fn main() {
    let mut rng = rand::rng();

    let mut mask = [0u8; 32];
    rng.fill_bytes(&mut mask);

    let mut fake_obfuscated = [0u8; 32];
    rng.fill_bytes(&mut fake_obfuscated);

    let mut fake_mask = [0u8; 32];
    rng.fill_bytes(&mut fake_mask);

    let mut entries = Vec::new();

    for (key, value) in env::vars() {
        if key.starts_with("VITE_API_AUTH_SECRET") && !value.is_empty() {
            let bytes: Vec<String> = value
                .as_bytes()
                .iter()
                .enumerate()
                .map(|(i, b)| format!("{:#04x}", b ^ mask[i % mask.len()]))
                .collect();
            entries.push(format!("({key:?}, &[{}])", bytes.join(", ")));
            println!("cargo:rerun-if-env-changed={key}");
        }
    }

    let fmt_array = |arr: &[u8; 32]| -> String {
        arr.iter()
            .map(|b| format!("{b:#04x}"))
            .collect::<Vec<_>>()
            .join(", ")
    };

    let generated = format!(
        "pub static SECRETS: &[(&str, &[u8])] = &[{}];\n\
         pub const MASK: [u8; 32] = [{}];\n\
         pub const FAKE_OBFUSCATED: [u8; 32] = [{}];\n\
         pub const FAKE_MASK: [u8; 32] = [{}];\n",
        entries.join(", "),
        fmt_array(&mask),
        fmt_array(&fake_obfuscated),
        fmt_array(&fake_mask),
    );

    let out_dir = env::var("OUT_DIR").unwrap();
    fs::write(Path::new(&out_dir).join("secrets.rs"), generated).unwrap();

    println!("cargo:rerun-if-changed=build.rs");
}
