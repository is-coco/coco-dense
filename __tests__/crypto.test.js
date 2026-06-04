const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const {
  IV_LENGTH,
  KEY_LENGTH,
  SALT_LENGTH,
  PBKDF2_ROUNDS,
  VAULT_FORMAT_V2,
  VAULT_FORMAT_V3,
  deriveKey,
  encryptLegacyJson,
  decryptLegacyJson,
  encryptBufferWithPassword,
  decryptBufferWithPassword,
  encryptWithVaultKey,
  decryptWithVaultKey,
  isEnvelopeVault,
  isDataKeyVault,
  makeUnlockError,
  encryptJson,
  verifyDataKeyVaultMaster,
  decryptVault,
  decryptJson,
  encryptText,
  decryptText,
  generateDataKeySecret,
} = require("../src/main/crypto");

/* ──────────── 常量 ──────────── */

describe("常量", () => {
  it("IV_LENGTH 为 12", () => assert.equal(IV_LENGTH, 12));
  it("KEY_LENGTH 为 32", () => assert.equal(KEY_LENGTH, 32));
  it("SALT_LENGTH 为 16", () => assert.equal(SALT_LENGTH, 16));
  it("PBKDF2_ROUNDS 为 250000", () => assert.equal(PBKDF2_ROUNDS, 250000));
  it("VAULT_FORMAT_V2 为 coco-dense-envelope-v2", () =>
    assert.equal(VAULT_FORMAT_V2, "coco-dense-envelope-v2"));
  it("VAULT_FORMAT_V3 为 coco-dense-envelope-v3", () =>
    assert.equal(VAULT_FORMAT_V3, "coco-dense-envelope-v3"));
});

/* ──────────── deriveKey ──────────── */

describe("deriveKey", () => {
  it("相同密码和 salt 生成相同密钥", () => {
    const salt = crypto.randomBytes(SALT_LENGTH).toString("base64");
    const k1 = deriveKey("test-password", salt);
    const k2 = deriveKey("test-password", salt);
    assert.ok(k1.equals(k2), "两次派生的密钥应完全一致");
  });

  it("不同密码生成不同密钥", () => {
    const salt = crypto.randomBytes(SALT_LENGTH).toString("base64");
    const k1 = deriveKey("password-a", salt);
    const k2 = deriveKey("password-b", salt);
    assert.ok(!k1.equals(k2), "不同密码应产生不同密钥");
  });

  it("不同 salt 生成不同密钥", () => {
    const salt1 = crypto.randomBytes(SALT_LENGTH).toString("base64");
    const salt2 = crypto.randomBytes(SALT_LENGTH).toString("base64");
    const k1 = deriveKey("same-password", salt1);
    const k2 = deriveKey("same-password", salt2);
    assert.ok(!k1.equals(k2), "不同 salt 应产生不同密钥");
  });

  it("输出长度为 KEY_LENGTH (32)", () => {
    const salt = crypto.randomBytes(SALT_LENGTH).toString("base64");
    const key = deriveKey("pw", salt);
    assert.equal(key.length, KEY_LENGTH);
  });
});

/* ──────────── Legacy JSON 加解密 ──────────── */

describe("encryptLegacyJson / decryptLegacyJson", () => {
  it("基本加解密往返", () => {
    const payload = { entries: [{ id: "1", site: "example.com" }], version: 1 };
    const encrypted = encryptLegacyJson("master123", payload);
    const decrypted = decryptLegacyJson("master123", encrypted);
    assert.deepEqual(decrypted, payload);
  });

  it("错误密码解密失败", () => {
    const payload = { data: "secret" };
    const encrypted = encryptLegacyJson("correct-password", payload);
    assert.throws(
      () => decryptLegacyJson("wrong-password", encrypted),
      { message: /decrypt|auth|tag/i },
    );
  });

  it("输出结构包含所有必要字段", () => {
    const encrypted = encryptLegacyJson("pw", { x: 1 });
    assert.equal(encrypted.version, 1);
    assert.equal(encrypted.kdf, "pbkdf2");
    assert.equal(encrypted.rounds, PBKDF2_ROUNDS);
    assert.ok(encrypted.salt);
    assert.ok(encrypted.iv);
    assert.ok(encrypted.tag);
    assert.ok(encrypted.data);
  });

  it("每次加密产生不同的 salt 和 iv", () => {
    const e1 = encryptLegacyJson("pw", { a: 1 });
    const e2 = encryptLegacyJson("pw", { a: 1 });
    assert.notEqual(e1.salt, e2.salt, "salt 应随机");
    assert.notEqual(e1.iv, e2.iv, "iv 应随机");
    assert.notEqual(e1.data, e2.data, "密文应不同");
  });
});

/* ──────────── Buffer 加解密 ──────────── */

describe("encryptBufferWithPassword / decryptBufferWithPassword", () => {
  it("基本往返", () => {
    const original = Buffer.from("hello-buffer-world", "utf8");
    const encrypted = encryptBufferWithPassword("pw", original);
    const decrypted = decryptBufferWithPassword("pw", encrypted);
    assert.ok(original.equals(decrypted));
  });

  it("错误密码失败", () => {
    const buf = Buffer.from("data");
    const encrypted = encryptBufferWithPassword("right", buf);
    assert.throws(() => decryptBufferWithPassword("wrong", encrypted));
  });

  it("支持任意二进制数据", () => {
    const randomBuf = crypto.randomBytes(1024);
    const encrypted = encryptBufferWithPassword("pw", randomBuf);
    const decrypted = decryptBufferWithPassword("pw", encrypted);
    assert.ok(randomBuf.equals(decrypted));
  });
});

/* ──────────── VaultKey 加解密 ──────────── */

describe("encryptWithVaultKey / decryptWithVaultKey", () => {
  it("基本往返", () => {
    const vaultKey = crypto.randomBytes(KEY_LENGTH);
    const payload = { name: "test", value: 42 };
    const encrypted = encryptWithVaultKey(vaultKey, payload);
    const decrypted = decryptWithVaultKey(vaultKey, encrypted);
    assert.deepEqual(decrypted, payload);
  });

  it("错误密钥失败", () => {
    const key1 = crypto.randomBytes(KEY_LENGTH);
    const key2 = crypto.randomBytes(KEY_LENGTH);
    const encrypted = encryptWithVaultKey(key1, { secret: true });
    assert.throws(() => decryptWithVaultKey(key2, encrypted));
  });

  it("支持 null payload", () => {
    const vaultKey = crypto.randomBytes(KEY_LENGTH);
    const encrypted = encryptWithVaultKey(vaultKey, null);
    const decrypted = decryptWithVaultKey(vaultKey, encrypted);
    assert.equal(decrypted, null);
  });

  it("输出结构正确", () => {
    const vaultKey = crypto.randomBytes(KEY_LENGTH);
    const enc = encryptWithVaultKey(vaultKey, { a: 1 });
    assert.equal(enc.version, 1);
    assert.equal(enc.alg, "aes-256-gcm");
    assert.ok(enc.iv);
    assert.ok(enc.tag);
    assert.ok(enc.data);
  });
});

/* ──────────── 类型判断 ──────────── */

describe("isEnvelopeVault / isDataKeyVault", () => {
  it("识别 v2 格式", () => {
    const v2 = { version: 2, format: VAULT_FORMAT_V2, key: {} };
    assert.ok(isEnvelopeVault(v2));
    assert.ok(!isDataKeyVault(v2));
  });

  it("识别 v3 格式", () => {
    const v3 = { version: 3, format: VAULT_FORMAT_V3, auth: {}, key: {} };
    assert.ok(isDataKeyVault(v3));
    assert.ok(!isEnvelopeVault(v3));
  });

  it("非密封格式返回 false", () => {
    assert.ok(!isEnvelopeVault(null));
    assert.ok(!isEnvelopeVault({}));
    assert.ok(!isDataKeyVault(null));
    assert.ok(!isDataKeyVault({ version: 1 }));
  });
});

/* ──────────── makeUnlockError ──────────── */

describe("makeUnlockError", () => {
  it("创建带 code 的 Error", () => {
    const err = makeUnlockError("密码错误", "MASTER_PASSWORD_INVALID");
    assert.ok(err instanceof Error);
    assert.equal(err.message, "密码错误");
    assert.equal(err.code, "MASTER_PASSWORD_INVALID");
  });
});

/* ──────────── encryptJson / decryptVault (v2) ──────────── */

describe("encryptJson + decryptVault (v2 无数据钥匙)", () => {
  const masterPassword = "my-strong-password-123";

  it("加解密完整往返", () => {
    const payload = {
      entries: [
        { id: "e1", site: "GitHub", account: "user@test.com", password: "s3cret" },
        { id: "e2", site: "Gmail", account: "me@gmail.com", password: "pass456" },
      ],
    };
    const vault = encryptJson(masterPassword, payload);
    const result = decryptVault(masterPassword, vault);

    assert.equal(result.legacy, false);
    assert.equal(result.payload.entries.length, 2);
    assert.equal(result.payload.entries[0].site, "GitHub");
    assert.equal(result.payload.entries[1].password, "pass456");
  });

  it("v2 格式识别", () => {
    const vault = encryptJson(masterPassword, { entries: [] });
    assert.equal(vault.version, 2);
    assert.equal(vault.format, VAULT_FORMAT_V2);
    assert.ok(isEnvelopeVault(vault));
  });

  it("错误密码无法解密", () => {
    const vault = encryptJson(masterPassword, { entries: [] });
    assert.throws(() => decryptVault("wrong", vault));
  });

  it("保留 meta 信息", () => {
    const payload = {
      createdAt: "2024-01-01T00:00:00.000Z",
      entries: [],
    };
    const vault = encryptJson(masterPassword, payload);
    const result = decryptVault(masterPassword, vault);
    assert.equal(result.payload.createdAt, "2024-01-01T00:00:00.000Z");
  });

  it("保留 settings", () => {
    const payload = {
      entries: [],
      settings: { autoLockMinutes: 10, passwordLength: 20 },
    };
    const vault = encryptJson(masterPassword, payload);
    const result = decryptVault(masterPassword, vault);
    assert.equal(result.payload.settings.autoLockMinutes, 10);
    assert.equal(result.payload.settings.passwordLength, 20);
  });

  it("空 entries 列表正常工作", () => {
    const vault = encryptJson(masterPassword, { entries: [] });
    const result = decryptVault(masterPassword, vault);
    assert.deepEqual(result.payload.entries, []);
  });

  it("密码正确但无数据钥匙时 v3 格式抛错", () => {
    const vault = encryptJson(masterPassword, { entries: [] }, { format: "v3", dataKey: "some-data-key" });
    assert.throws(() => decryptVault(masterPassword, vault), (err) => {
      return err.code === "DATA_KEY_REQUIRED";
    });
  });
});

/* ──────────── encryptJson / decryptVault (v3 带数据钥匙) ──────────── */

describe("encryptJson + decryptVault (v3 带数据钥匙)", () => {
  const masterPassword = "master-pw";
  const dataKey = "my-secret-data-key-abc";

  it("加解密完整往返", () => {
    const payload = {
      entries: [
        { id: "e1", site: "Bank", account: "john", password: "1234" },
      ],
    };
    const vault = encryptJson(masterPassword, payload, { format: "v3", dataKey });
    const result = decryptVault(masterPassword, vault, { dataKey });

    assert.equal(result.legacy, false);
    assert.equal(result.dataKeyVault, true);
    assert.equal(result.payload.entries[0].site, "Bank");
  });

  it("v3 格式识别", () => {
    const vault = encryptJson(masterPassword, { entries: [] }, { format: "v3", dataKey });
    assert.equal(vault.version, 3);
    assert.equal(vault.format, VAULT_FORMAT_V3);
    assert.ok(isDataKeyVault(vault));
    assert.ok(vault.auth, "v3 应包含 auth 字段");
  });

  it("主密码错误时抛 MASTER_PASSWORD_INVALID", () => {
    const vault = encryptJson(masterPassword, { entries: [] }, { format: "v3", dataKey });
    assert.throws(() => decryptVault("wrong-master", vault, { dataKey }), (err) => {
      return err.code === "MASTER_PASSWORD_INVALID";
    });
  });

  it("数据钥匙错误时抛 DATA_KEY_INVALID", () => {
    const vault = encryptJson(masterPassword, { entries: [] }, { format: "v3", dataKey });
    assert.throws(() => decryptVault(masterPassword, vault, { dataKey: "wrong-key" }), (err) => {
      return err.code === "DATA_KEY_INVALID";
    });
  });

  it("未提供数据钥匙时抛 DATA_KEY_REQUIRED", () => {
    const vault = encryptJson(masterPassword, { entries: [] }, { format: "v3", dataKey });
    assert.throws(() => decryptVault(masterPassword, vault), (err) => {
      return err.code === "DATA_KEY_REQUIRED";
    });
  });

  it("无 format 参数但有 dataKey 时自动使用 v3", () => {
    const vault = encryptJson(masterPassword, { entries: [] }, { dataKey });
    const result = decryptVault(masterPassword, vault, { dataKey });
    assert.equal(result.dataKeyVault, true);
  });
});

/* ──────────── verifyDataKeyVaultMaster ──────────── */

describe("verifyDataKeyVaultMaster", () => {
  it("正确密码返回 true", () => {
    const vault = encryptJson("pw", { entries: [] }, { format: "v3", dataKey: "dk" });
    assert.ok(verifyDataKeyVaultMaster("pw", vault));
  });

  it("错误密码返回 false", () => {
    const vault = encryptJson("pw", { entries: [] }, { format: "v3", dataKey: "dk" });
    assert.ok(!verifyDataKeyVaultMaster("wrong", vault));
  });
});

/* ──────────── decryptJson ──────────── */

describe("decryptJson", () => {
  it("直接返回 payload（不含 legacy/vaultKey 等包装）", () => {
    const pw = "test-pw";
    const payload = { entries: [{ id: "1", site: "a" }], settings: { x: 1 } };
    const vault = encryptJson(pw, payload);
    const result = decryptJson(pw, vault);
    assert.deepEqual(result.entries[0].site, "a");
    assert.deepEqual(result.settings.x, 1);
  });
});

/* ──────────── encryptText / decryptText ──────────── */

describe("encryptText / decryptText", () => {
  it("基本往返", () => {
    const encrypted = encryptText("secret-key", "这是一段中文密码备注");
    const decrypted = decryptText("secret-key", encrypted);
    assert.equal(decrypted, "这是一段中文密码备注");
  });

  it("空字符串", () => {
    const encrypted = encryptText("key", "");
    const decrypted = decryptText("key", encrypted);
    assert.equal(decrypted, "");
  });

  it("错误密钥失败", () => {
    const encrypted = encryptText("key-a", "data");
    assert.throws(() => decryptText("key-b", encrypted));
  });

  it("输出结构正确", () => {
    const enc = encryptText("key", "test");
    assert.equal(enc.version, 1);
    assert.equal(enc.kdf, "pbkdf2");
    assert.equal(enc.rounds, PBKDF2_ROUNDS);
  });
});

/* ──────────── generateDataKeySecret ──────────── */

describe("generateDataKeySecret", () => {
  it("返回 base64url 格式的随机字符串", () => {
    const key = generateDataKeySecret();
    assert.equal(typeof key, "string");
    assert.ok(key.length > 20, "密钥应有足够长度");
    assert.ok(!key.includes("+"), "base64url 不应包含 +");
    assert.ok(!key.includes("/"), "base64url 不应包含 /");
  });

  it("每次生成不同", () => {
    const k1 = generateDataKeySecret();
    const k2 = generateDataKeySecret();
    assert.notEqual(k1, k2);
  });
});

/* ──────────── 大数据量压力测试 ──────────── */

describe("压力测试", () => {
  it("100 个条目加解密", () => {
    const entries = Array.from({ length: 100 }, (_, i) => ({
      id: `entry-${i}`,
      site: `site-${i}.com`,
      account: `user-${i}`,
      password: `pwd-${i}-${Math.random()}`,
      url: `https://site-${i}.com`,
      tags: `tag-${i % 5}`,
      notes: `备注内容 ${i}`,
    }));
    const payload = { entries };
    const pw = "stress-test-pw";
    const vault = encryptJson(pw, payload);
    const result = decryptVault(pw, vault);
    assert.equal(result.payload.entries.length, 100);
    assert.equal(result.payload.entries[99].site, "site-99.com");
  });

  it("v3 100 个条目加解密", () => {
    const entries = Array.from({ length: 100 }, (_, i) => ({
      id: `e-${i}`,
      site: `v3-site-${i}.com`,
      account: `user-${i}`,
      password: `pwd-${i}`,
    }));
    const pw = "master";
    const dk = "data-key-stress";
    const vault = encryptJson(pw, { entries }, { format: "v3", dataKey: dk });
    const result = decryptVault(pw, vault, { dataKey: dk });
    assert.equal(result.payload.entries.length, 100);
  });
});

/* ──────────── 跨版本兼容 ──────────── */

describe("跨版本兼容", () => {
  it("v2 加密的 vault 可正常解密", () => {
    const pw = "compat-pw";
    const payload = { entries: [{ id: "1", site: "legacy.com" }] };
    const vault = encryptJson(pw, payload);
    assert.equal(vault.version, 2);
    const result = decryptVault(pw, vault);
    assert.equal(result.payload.entries[0].site, "legacy.com");
    assert.equal(result.legacy, false);
  });

  it("legacy 格式的 vault 可正常解密", () => {
    const pw = "legacy-pw";
    const payload = { entries: [{ id: "1", site: "old.com" }] };
    const legacy = encryptLegacyJson(pw, payload);
    const result = decryptVault(pw, legacy);
    assert.equal(result.legacy, true);
    assert.equal(result.payload.entries[0].site, "old.com");
  });
});
