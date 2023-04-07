# MyShows: TV show tracker

[ ![addons.mozilla.org/](https://user-images.githubusercontent.com/1577569/225926070-baa9ed48-841c-4ce7-bf70-557f848eed23.png)](https://addons.mozilla.org/firefox/addon/myshows-tv-show-tracker/)
[ ![chrome.google.com/](https://i.imgur.com/unvdmLG.png)](https://chrome.google.com/webstore/detail/myshows-tv-show-tracker/lcdinflfffodmodbkhaijglgjpeefodo/)


Unofficial Firefox/Chrome extension for [MyShows.me](https://myshows.me), that allows you to track aired and future episodes
of TV shows you watch.

Неофициальное Firefox/Chrome расширение для сайта [MyShows.me](https://myshows.me), которое позволяет отмечать просмотренные серии и следить
за будущими эпизодами выбранных сериалов.

## Usage for developers

Watch for changes in js files and run corresponding browser with `web-ext`.

    npm run dev:chrome
    npm run dev:ff

Create production build in the **extension** folder.

    npm run build:chrome
    npm run build:ff

The extension uses [MyShows API](http://api.myshows.me/). Use need to create `.env` file and add credentials there.

## License

The code of the extension is licensed under the [MPL-2.0](LICENSE). [Font Awesome](https://fontawesome.com) icons is
licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Myshows logotype belongs to [myshows.me](https://myshows.me).
