/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "fad2ec8ee8ea32ab316953b8615e5914"
  }, {
    "url": "pwa-512x512.png",
    "revision": "fad2ec8ee8ea32ab316953b8615e5914"
  }, {
    "url": "pwa-192x192.png",
    "revision": "f12cec52de0d94cf10ff20178fe0b634"
  }, {
    "url": "index.html",
    "revision": "b5f95adb6da3b3a851ba92fa5038dbc6"
  }, {
    "url": "icon.svg",
    "revision": "476b8ebd2413918b5090ffdbfe8a58ee"
  }, {
    "url": "favicon.png",
    "revision": "ca01c333bed23a780132510a8dd6403e"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "159a3e3bbe4cf10eb3af2c978222f3af"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/index-BnMY9kk2.js",
    "revision": null
  }, {
    "url": "assets/index-BS1SvVvI.css",
    "revision": null
  }, {
    "url": "assets/aistudio/image_fbba049c.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_f8585a69.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_f0d29b5d.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_eeb1180a.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_e8c60a25.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_e82002be.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_e6111ae2.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_df159bed.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_d654a78a.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_c6532469.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_b7e38c73.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_ad9af3d2.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_a9578895.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_a34d228c.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_985cc44b.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_93ce45b5.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_8cbdeaae.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_76bd8a48.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_690ba7ff.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_67b0a0e5.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_4a935f94.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_49969c5e.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_2f98b764.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_26e1a7d5.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_102a7aeb.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "159a3e3bbe4cf10eb3af2c978222f3af"
  }, {
    "url": "favicon.png",
    "revision": "ca01c333bed23a780132510a8dd6403e"
  }, {
    "url": "icon.svg",
    "revision": "476b8ebd2413918b5090ffdbfe8a58ee"
  }, {
    "url": "pwa-192x192.png",
    "revision": "f12cec52de0d94cf10ff20178fe0b634"
  }, {
    "url": "pwa-512x512.png",
    "revision": "fad2ec8ee8ea32ab316953b8615e5914"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "fad2ec8ee8ea32ab316953b8615e5914"
  }, {
    "url": "manifest.json",
    "revision": "e551466974d96910e4e58d53797b6cd1"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
