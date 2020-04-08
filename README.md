# MyShows: TV show tracker

[ ![addons.mozilla.org/](https://ffp4g1ylyit3jdyti1hqcvtb-wpengine.netdna-ssl.com/addons/files/2015/11/get-the-addon.png)](https://addons.mozilla.org/firefox/addon/myshows-tv-show-tracker/)
[ ![chrome.google.com/](https://developer.chrome.com/webstore/images/ChromeWebStore_BadgeWBorder_v2_206x58.png)](https://chrome.google.com/webstore/detail/myshows-tv-show-tracker/lcdinflfffodmodbkhaijglgjpeefodo/)

Unofficial Firefox/Chrome extension for [MyShows.me](https://myshows.me), that allows you to track aired and future episodes
of TV shows you watch.

Неофициальное Firefox/Chrome расширение для сайта [MyShows.me](https://myshows.me), которое позволяет отмечать просмотренные серии и следить
за будущими эпизодами выбранных сериалов.

## Usage for developers

- `npm run start:ff`
  - build the extension with [webpack](https://github.com/webpack/webpack) and run it in Firefox using [web-ext](https://github.com/mozilla/web-ext)
- `npm run buildzip:ff`
  - create an extension package from source

The extension uses [MyShows JSON-RPC API](https://api.myshows.me/shared/doc/).
To make it work you need credentials and then add them in `/js/config.js`;

## License

The code of the extension is licensed under the [MPL-2.0](LICENSE). [Font Awesome](https://fontawesome.com) icons is
licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
[TV icon](https://www.flaticon.com/free-icon/television_167018) made by [Freepik](https://freepik.com)
from [flaticon.com](https://www.flaticon.com) under [Flaticon Basic License](https://file000.flaticon.com/downloads/license/license.pdf).
Myshows logotype belongs to [myshows.me](https://myshows.me).
