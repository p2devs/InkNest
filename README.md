<p align="center">
  <img src="./.github/readme-images/icon.png" align="center" width="128" />
<p>
  
<h1 align="center">
  InkNest
</h1>

<div align="center">
  <a href="https://discord.gg/WYwJefvWNT" style={{ marginRight: '10px', marginBottom: '10px' }}>
    <img alt="Discord Chat" src="https://img.shields.io/discord/1281938822275403817.svg?logo=discord&logoColor=white&logoWidth=20&labelColor=7289DA&label=Discord&color=17cf48">
  </a>
  <a href="https://p2devs.github.io/InkNest/" style={{ marginRight: '10px', marginBottom: '10px' }}>
    <img alt="Website" src="https://img.shields.io/badge/Website-000000?style=flat&logo=googlechrome&logoColor=white" >
  </a>
  <a href="https://github.com/p2devs/InkNest/releases/latest" style={{ marginRight: '10px', marginBottom: '10px' }}>
    <img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/p2devs/InkNest">
  </a>
  <a href="https://github.com/p2devs/InkNest/blob/main/LICENSE" style={{ marginRight: '10px', marginBottom: '10px' }}>
    <img alt="GitHub" src="https://img.shields.io/github/license/p2devs/InkNest">
  </a>
</div>

<p align="left">
  InkNest is a free mobile app offering a vast collection of comics and anime across genres like superheroes, sci-fi, fantasy, and manga. Enjoy a seamless experience with user-friendly navigation and customizable settings. Stay updated with the latest releases and classics. With InkNest, your favorite stories and characters are always at your fingertips.
</p>

### 🌟 Star this repository to support the developer and encourage further development of the application

> **Warning**
> Please do not attempt to upload InkNest or any of its forks to the Play Store, App Store, or any other stores on the internet. Doing so may infringe their terms and conditions, potentially resulting in legal action or immediate takedown of the app.

## Features

- **CBZ and CBR Reader**: Added support for reading CBZ and CBR comic files.
- **Comic Read History**: Track your watched anime episodes effortlessly.
- **Bookmark in Anime & Comic**: Bookmark your favorite anime shows for quick access.
- **Vast Comic & Anime Library**: Access a wide range of comic books across various genres including superheroes, sci-fi, fantasy.
- **User-Friendly Interface**: Intuitive and easy-to-use navigation ensures a seamless reading experience.
- **Releases updates**: Stay up-to-date with new releases.
- **Search and Discover**: Easily find comics & anime with search functionality and explore curated collections.
- **Push Notifications**: We have implemented push notifications to inform users about new releases, updates.

## Installation

### Prerequisites

- Node.js (>= 18.0)
- Yarn (recommended)
- Xcode
- Android Studio
- Vs Code (IDE)
- JAVA 18+

### Required Files

Before running the project, make sure to add the following files:

1. `google-services.json` (for Android) in the `android/app` directory.
2. `GoogleService-Info.plist` (for iOS) in the `ios` directory.
3. Rename `/src/Screens/Comic/LocalComic/example.index.js` to `index.js`.

### Steps

1. Clone the repository:

   ```sh
   git clone https://github.com/p2devs/InkNest.git
   cd InkNest
   ```

2. Install dependencies:

   ```sh
   yarn install
   ```

3. Start the development server:

   ```sh
   yarn start
   ```

## Running on Android

1. Start the Android emulator or connect an Android device.
2. Run the following command:

   ```sh
   yarn android
   ```

## Running on iOS

1. Install CocoaPods dependencies:

   ```sh
   cd ios
   pod install
   cd ..
   ```

2. Start the iOS simulator or connect an iOS device.
3. Run the following command:

   ```sh
   yarn ios
   ```

## Documentation

The documentation is managed using Docusaurus. To view the documentation locally:

1. Navigate to the `docs` directory:

   ```sh
   cd docs
   ```

2. Install dependencies:

   ```sh
   yarn install
   ```

3. Start the documentation server:

   ```sh
   yarn start
   ```

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## DISCLAIMER

- InkNest only scrapes links from various websites, making it easier for users to find anime and comics.
- Neither InkNest nor its developers/staff host any of the content found within the app. All images and anime/comic information in the app are sourced from various public APIs.
- Additionally, all anime/comic links in InkNest are obtained from various third-party anime hosting websites.
- InkNest and its owners aren't liable for any misuse of the content found inside or outside the app and cannot be held accountable for the distribution of any content found within the app.
- By using InkNest, you agree that the developers are not responsible for any content found in the app; this content may or may not come from legitimate sources.
- If internet infringement issues arise, please contact the source website. The developer does not assume any legal responsibility.

## Contact

For any inquiries, feel free to reach out through one of the following channels:

- **Email**: [inknest@2hub.live](mailto:inknest@2hub.live)
- **Discord**: Join our community on [Discord](https://discord.gg/WYwJefvWNT) for real-time support and discussion.
- **GitHub Discussions**: Visit our [GitHub Discussions board](https://github.com/p2devs/InkNest/discussions) to engage with our community, ask questions, and find answers to common issues.

We're here to help!

## Download

Get the app from our [releases page](https://github.com/p2devs/InkNest/releases).

## License

This project is licensed under the GNU General Public License. See the [LICENSE](LICENSE) file for more details.

## InkNest Sources

InkNest uses the following sources to provide you with the best experience:

- [readallcomics](https://readallcomics.com/)
- [azcomix](https://azcomix.me/)
- [gogoanimes](https://ww12.gogoanimes.fi/)
- [s3taku](https://s3taku.com/)

## Acknowledgements

- [React Native](https://reactnative.dev/)
- [Docusaurus](https://docusaurus.io/)
- [Redux](https://redux.js.org/)
- [Firebase](https://firebase.google.com/)
