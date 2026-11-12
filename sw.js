// Bump the number whenever you change any cached file,
// otherwise installed copies will keep serving the old version.
const CACHE_NAME = "habit-tracker-v3-cache-2";


const FILES_TO_CACHE = [

    "./",
    "./index.html",
    "./manifest.json",
    "./css/style.css",
    "./js/app.js"

];



self.addEventListener(
    "install",
    event => {

        self.skipWaiting();

        event.waitUntil(

            caches.open(CACHE_NAME)
            .then(cache => {

                return cache.addAll(
                    FILES_TO_CACHE
                );

            })

        );

    }
);



// Remove old v3 caches only (never touches other apps' caches)
self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys().then(keys => {

                return Promise.all(

                    keys
                    .filter(key =>
                        key.startsWith("habit-tracker-v3-cache-")
                        && key !== CACHE_NAME
                    )
                    .map(key => caches.delete(key))

                );

            })
            .then(() => self.clients.claim())

        );

    }
);



self.addEventListener(
    "fetch",
    event => {

        event.respondWith(

            caches.match(
                event.request
            )
            .then(response => {

                return response || fetch(event.request);

            })

        );

    }
);
