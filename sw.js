// サービスワーカー：アプリのファイルを携帯の中に保管して、電波がなくても開けるようにするしくみ。
// アプリを直したときは、下の「v1」の数字を1つ増やすと、携帯の中の古い保管分が入れかわります。
const CACHE = "sauna-check-v1";
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
];

// はじめて入ったとき：ファイルをまとめて保管
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

// 新しい版になったとき：このアプリの古い保管分だけを消す
// （同じサイトの sauna-app の保管分は消さないように、名前の頭で見分ける）
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith("sauna-check-") && k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// アプリ自身のファイル：まずネットから最新をとり、だめなら保管分を使う
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("./index.html")))
  );
});
