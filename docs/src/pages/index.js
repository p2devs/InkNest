import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import axios from 'axios';

import styles from './index.module.css';
import React, {useLayoutEffect, useState} from 'react';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  const [updateLogs, setUpdateLogs] = useState({});

  useLayoutEffect(() => {
    axios
      .get('https://api.github.com/repos/p2devs/InkNest/releases/latest')
      .then(response => {
        setUpdateLogs(response?.data);
      })
      .catch(error => {
        alert('Error', 'Failed to fetch update logs');
        console.log(error);
      });
  }, []);

  return (
    <header>
      <div className={styles.container}>
        <h1 className={styles.title}>{siteConfig.title}</h1>
        <div align="left">
          <a
            href="https://discord.gg/WYwJefvWNT"
            style={{
              marginRight: '10px',
              marginBottom: '10px',
            }}>
            <img
              alt="Discord Chat"
              src="https://img.shields.io/discord/1281938822275403817.svg?logo=discord&logoColor=white&logoWidth=20&labelColor=7289DA&label=Discord&color=17cf48"
            />
          </a>
          <a
            href="https://p2devs.github.io/InkNest/"
            style={{
              marginRight: '10px',
              marginBottom: '10px',
            }}>
            <img
              alt="Website"
              src="https://img.shields.io/badge/Website-000000?style=flat&logo=googlechrome&logoColor=white"
            />
          </a>
          <a
            href="https://github.com/p2devs/InkNest/releases/latest"
            style={{
              marginRight: '10px',
              marginBottom: '10px',
            }}>
            <img
              alt="GitHub release (latest by date)"
              src="https://img.shields.io/github/v/release/p2devs/InkNest"
            />
          </a>
          <a
            href="https://github.com/p2devs/InkNest/blob/main/LICENSE"
            style={{
              marginRight: '10px',
              marginBottom: '10px',
            }}>
            <img
              alt="GitHub"
              src="https://img.shields.io/github/license/p2devs/InkNest"
            />
          </a>
        </div>
        <h2 className={styles.subtitle}>{siteConfig.tagline}</h2>
        <p className={styles.description}>
          InkNest is a free mobile app offering a vast collection of comics and
          anime across genres like superheroes, sci-fi, fantasy, and manga.
          Enjoy a seamless experience with user-friendly navigation and
          customizable settings. Stay updated with the latest releases and
          classics. With InkNest, your favorite stories and characters are
          always at your fingertips.
        </p>
        <p style={{fontStyle: 'italic', fontWeight: 'bold', color: '#ffcc00'}}>
          🌟 Star this repository to support the developer and encourage further
          development of the application
        </p>
        <p style={{fontWeight: 'bold', color: '#ff6666'}}>
          ⚠️ Warning: Please do not attempt to upload InkNest or any of its
          forks to the Play Store, App Store, or any other stores on the
          internet. Doing so may infringe their terms and conditions,
          potentially resulting in legal action or immediate takedown of the
          app.
        </p>
        <div className={styles.buttons}>
          <button
            onClick={() => {
              window.open('https://testflight.apple.com/join/VejlezL5');
            }}
            className={styles.downloadButton}>
            Download iOS
          </button>
          <button
            onClick={() => {
              window.open(updateLogs?.assets?.[0]?.browser_download_url);
            }}
            className={styles.downloadButton}>
            Download Android
          </button>
        </div>

        <div className={styles.features}>
          <h2>Features</h2>
          <div className={styles.featuresContainer}>
            <div className={styles.feature}>
              <h3>Comic & Manga Read History</h3>
              <p>
                Track your reading history for easy access to previously read
                comics.
              </p>
            </div>
            <div className={styles.feature}>
              <h3>Bookmark Comic & Manga</h3>
              <p>Bookmark your favorite comics & manga for quick access.</p>
            </div>
            <div className={styles.feature}>
              <h3>Vast Comic & Manga Library</h3>
              <p>
                Access a wide range of comic & manga books across various genres
                including superheroes, sci-fi, fantasy.
              </p>
            </div>
            <div className={styles.feature}>
              <h3>User-Friendly Interface</h3>
              <p>
                Intuitive and easy-to-use navigation ensures a seamless reading
                experience.
              </p>
            </div>
            <div className={styles.feature}>
              <h3>Releases updates</h3>
              <p>Stay up-to-date with new releases.</p>
            </div>
            <div className={styles.feature}>
              <h3>Search and Discover</h3>
              <p>
                Easily find comics & manga with search functionality and explore
                curated collections.
              </p>
            </div>
            <div className={styles.feature}>
              <h3>Push Notifications</h3>
              <p>
                We have implemented push notifications to inform users about new
                releases, updates.
              </p>
            </div>
            <div className={styles.feature}>
              <h3>Offline Reading</h3>
              <p>Download comics & manga for offline reading.</p>
            </div>
            <div className={styles.feature}>
              <h3>Multi-Platform Support</h3>
              <p>Available on both Android and iOS devices.</p>
            </div>
            <div className={styles.feature}>
              <h3>Open Source</h3>
              <p>
                InkNest is open source, allowing users to contribute and improve
                the app.
              </p>
            </div>
            <div className={styles.feature}>
              <h3>Community Support</h3>
              <p>
                Join our community on Discord for real-time support and
                discussion.
              </p>
            </div>
            <div className={styles.feature}>
              <h3>CBZ and CBR Reader</h3>
              <p>Added support for reading CBZ and CBR comic files.</p>
            </div>
          </div>
        </div>

        <div className={styles.techStack}>
          <h2>Tech Stack</h2>
          <ul>
            <li>
              <a href="https://reactnative.dev/">React Native</a> -
              Cross-platform mobile framework
            </li>
            <li>
              <a href="https://redux.js.org/">Redux</a> - State management
            </li>
            <li>
              <a href="https://firebase.google.com/">Firebase</a> - Backend
              services
            </li>
            <li>
              <a href="https://docusaurus.io/">Docusaurus</a> - Documentation
            </li>
          </ul>
        </div>

        <div className={styles.projectStructure}>
          <h2>Project Structure</h2>
          <pre>
            <code>{`InkNest/
├── android/                # Android-specific code
├── ios/                    # iOS-specific code
├── src/                    # Source code
│   ├── Components/         # Reusable UI components
│   ├── Constants/          # App constants and configurations
│   ├── Navigation/         # Navigation setup
│   ├── Redux/              # State management
│   ├── Screens/            # App screens
│   └── Utils/              # Utility functions
├── docs/                   # Documentation using Docusaurus
├── __tests__/              # Tests
└── ...                     # Configuration files`}</code>
          </pre>
        </div>

        <div className={styles.contributing}>
          <h2>Contributing</h2>
          <p>
            We welcome contributions! Please read our{' '}
            <a href="https://github.com/p2devs/InkNest/blob/main/CONTRIBUTING.md">
              Contributing Guidelines
            </a>{' '}
            for more details.
          </p>
        </div>

        <div className={styles.disclaimer}>
          <h2>Disclaimer</h2>
          <ul>
            <li>
              InkNest only scrapes links from various websites, making it easier
              for users to find anime and comics.
            </li>
            <li>
              Neither InkNest nor its developers/staff host any of the content
              found within the app. All images and anime/comic information in
              the app are sourced from various public APIs.
            </li>
            <li>
              Additionally, all anime/comic links in InkNest are obtained from
              various third-party anime hosting websites.
            </li>
            <li>
              InkNest and its owners aren't liable for any misuse of the content
              found inside or outside the app and cannot be held accountable for
              the distribution of any content found within the app.
            </li>
            <li>
              By using InkNest, you agree that the developers are not
              responsible for any content found in the app; this content may or
              may not come from legitimate sources.
            </li>
            <li>
              If internet infringement issues arise, please contact the source
              website. The developer does not assume any legal responsibility.
            </li>
          </ul>
        </div>

        <div className={styles.contact}>
          <h2>Contact</h2>
          <p>
            For any inquiries, feel free to reach out through one of the
            following channels:
          </p>
          <ul>
            <li>
              Email:{' '}
              <a href="mailto:inknest@p2devs.engineer">
                inknest@p2devs.engineer
              </a>
            </li>
            <li>
              Discord: Join our{' '}
              <a href="https://discord.gg/WYwJefvWNT">Discord</a> server to stay
              updated with the latest releases and updates.
            </li>
            <li>
              Github Discussions: Visit our{' '}
              <a href="https://github.com/p2devs/InkNest/discussions">
                GitHub Discussions board
              </a>{' '}
              to engage with our community, ask questions, and find answers to
              common issues.
            </li>
          </ul>
          <p>We're here to help!</p>
        </div>

        <div className={styles.download}>
          <h2>Download</h2>
          <p>
            Get the app from our{' '}
            <a href="https://github.com/p2devs/InkNest/releases">
              releases page
            </a>
            .
          </p>
        </div>

        <div className={styles.sources}>
          <h2>InkNest Sources</h2>
          <p>
            InkNest uses the following sources to provide you with the best
            experience:
          </p>
          <ul>
            <li>
              <a href="https://readcomiconline.li/">readcomiconline</a>
            </li>
            <li>
              <a href="https://globalcomix.com/browse/en/comics">GlobalComix</a>
            </li>
            <li>
              <a href="https://bato.to/">Bato</a>
            </li>
            <li>
              <a href="https://mangadex.org/">MangaDex</a>
            </li>
            <li>
              <a href="https://www.colamanga.com">ColaManga</a>
            </li>
            <li>
              <a href="https://webtoons.com">WebToon</a>
            </li>
          </ul>
        </div>

        <div className={styles.acknowledgements}>
          <h2>Acknowledgements</h2>
          <ul>
            <li>
              <a href="https://reactnative.dev/">React Native</a>
            </li>
            <li>
              <a href="https://docusaurus.io/">Docusaurus</a>
            </li>
            <li>
              <a href="https://redux.js.org/">Redux</a>
            </li>
            <li>
              <a href="https://firebase.google.com/">Firebase</a>
            </li>
          </ul>
        </div>

        <div className={styles.license}>
          <h2>License</h2>
          <p>
            This project is licensed under the GNU General Public License. See
            the{' '}
            <a href="https://github.com/p2devs/InkNest/blob/main/LICENSE">
              LICENSE
            </a>{' '}
            file for more details.
          </p>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <Layout>
      <main>
        <HomepageHeader />
      </main>
    </Layout>
  );
}
