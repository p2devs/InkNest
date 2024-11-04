<p align="center">
  <img src="./.github/readme-images/icon.png" align="center" width="128" />
<p>
  
<h1 align="center">
  InkNest
</h1>
<p align="center">
  "InkNest" combines the imagery of ink, often used in comics, with the idea of a cozy or comfortable nest where readers can immerse themselves in their favorite comic books.
</p>
<div align="center">
  <a href="https://discord.gg/WYwJefvWNT">
    <img alt="Discord Chat" src="https://img.shields.io/discord/1281938822275403817.svg?logo=discord&logoColor=white&logoWidth=20&labelColor=7289DA&label=Discord&color=17cf48">
  </a>
  <a href="https://p2devs.github.io/InkNest/">
    <img alt="Website" src="https://img.shields.io/badge/Website-000000?style=flat&logo=googlechrome&logoColor=white" >
  </a>
  <a href="https://github.com/p2devs/InkNest/releases/latest">
    <img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/p2devs/InkNest">
  </a>
  <a href="https://github.com/p2devs/InkNest/blob/main/LICENSE">
    <img alt="GitHub" src="https://img.shields.io/github/license/p2devs/InkNest">
  </a>
</div>

### InkNest Anime
[InkNest Anime](https://github.com/user-attachments/assets/09406399-b949-44be-b0cc-e54658c5ad8b)

### InkNest Comic
[InkNest Comic](https://github.com/user-attachments/assets/5cd29ece-4e9c-438a-9a82-aac53add640f)

## Overview

InkNest is a mobile application that allows users to explore comics & anime for free. The application is built using React Native and includes features such as search functionality and versioned documentation managed by Docusaurus.

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

## License

This project is licensed under the GNU General Public License. See the [LICENSE](LICENSE) file for more details.

## Contact

For any inquiries, feel free to reach out through one of the following channels:

- **Email**: [inknest@2hub.live](mailto:inknest@2hub.live)
- **Discord**: Join our community on [Discord](https://discord.gg/WYwJefvWNT) for real-time support and discussion.
- **GitHub Discussions**: Visit our [GitHub Discussions board](https://github.com/p2devs/InkNest/discussions) to engage with our community, ask questions, and find answers to common issues.

We're here to help!

## Download

Get the app from our [releases page](https://github.com/p2devs/InkNest/releases).

## Acknowledgements

- [React Native](https://reactnative.dev/)
- [Docusaurus](https://docusaurus.io/)
- [Redux](https://redux.js.org/)
- [Firebase](https://firebase.google.com/)
