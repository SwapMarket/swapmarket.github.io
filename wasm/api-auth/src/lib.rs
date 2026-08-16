use hmac::{Hmac, Mac};
use sha2::Sha256;
use wasm_bindgen::prelude::*;
use zeroize::Zeroizing;

include!(concat!(env!("OUT_DIR"), "/secrets.rs"));

fn decoy(ts: &str, method: &str, path: &str, body: &[u8]) -> Option<Vec<u8>> {
    let fake_key: Zeroizing<Vec<u8>> = Zeroizing::new(
        FAKE_OBFUSCATED
            .iter()
            .enumerate()
            .map(|(i, b)| b ^ FAKE_MASK[i % FAKE_MASK.len()])
            .collect(),
    );

    let mut mac = Hmac::<Sha256>::new_from_slice(&fake_key).ok()?;
    mac.update(ts.as_bytes());
    mac.update(method.as_bytes());
    mac.update(path.as_bytes());
    mac.update(body);

    Some(mac.finalize().into_bytes().to_vec())
}

#[wasm_bindgen]
pub fn sign(
    secret_name: &str,
    ts: &str,
    method: &str,
    path: &str,
    body: &[u8],
) -> Result<Vec<u8>, JsValue> {
    let obfuscated = SECRETS
        .iter()
        .find(|(name, _)| *name == secret_name)
        .map(|(_, value)| *value)
        .ok_or_else(|| JsValue::from_str(&format!("no secret baked in for {secret_name}")))?;

    std::hint::black_box(decoy(ts, method, path, body));

    let secret: Zeroizing<Vec<u8>> = Zeroizing::new(
        obfuscated
            .iter()
            .enumerate()
            .map(|(i, b)| b ^ MASK[i % MASK.len()])
            .collect(),
    );

    let mut mac =
        Hmac::<Sha256>::new_from_slice(&secret).map_err(|e| JsValue::from_str(&e.to_string()))?;
    mac.update(ts.as_bytes());
    mac.update(method.as_bytes());
    mac.update(path.as_bytes());
    mac.update(body);

    Ok(mac.finalize().into_bytes().to_vec())
}
