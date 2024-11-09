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
        <div className={styles.buttons}>
          {/* <button className={styles.getStartedButton}>Get started</button> */}
          <button
            onClick={() => {
              window.open('https://testflight.apple.com/join/VejlezL5');
            }}
            className={styles.downloadButton}>
            Download iOS
          </button>
          <button
            onClick={() => {
              window.open(updateLogs?.assets[0].browser_download_url);
            }}
            className={styles.downloadButton}>
            Download Android
          </button>
        </div>

        <div className={styles.features}>
          <h2>Features</h2>
          <div className={styles.featuresContainer}>
            <div className={styles.feature}>
              <h3>CBZ and CBR Reader</h3>
              <p>Added support for reading CBZ and CBR comic files.</p>
            </div>
            <div className={styles.feature}>
              <h3>Comic Read History</h3>
              <p>Track your watched anime episodes effortlessly.</p>
            </div>
            <div className={styles.feature}>
              <h3>Bookmark in Anime & Comic</h3>
              <p>Bookmark your favorite anime shows for quick access.</p>
            </div>
            <div className={styles.feature}>
              <h3>Vast Comic & Anime Library</h3>
              <p>
                Access a wide range of comic books across various genres
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
                Easily find comics & anime with search functionality and explore
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
          </div>
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
              Email: <a href="mailto:inknest@2hub.live">inknest@2hub.live</a>{' '}
            </li>
            <li>
              Discord: Join our{' '}
              <a href="https://discord.gg/WYwJefvWNT"> Discord </a> server to
              stay updated with the latest releases and updates.
            </li>
            <li>
              Github Discussions: Visit our{' '}
              <a href="https://github.com/p2devs/InkNest/discussions">
                {' '}
                GitHub Discussions board{' '}
              </a>
              to engage with our community, ask questions, and find answers to
              common issues.
            </li>
          </ul>
          <p>We're here to help!</p>
        </div>

        <div className={styles.sources}>
          <h2>InkNest Sources</h2>
          <p>
            InkNest uses the following sources to provide you with the best
            experience:
          </p>
          <ul>
            <li>
              <a href="https://readallcomics.com/">readallcomics</a>
            </li>
            <li>
              <a href="https://azcomix.me/">azcomix</a>
            </li>
            <li>
              <a href="https://ww12.gogoanimes.fi/">gogoanimes</a>
            </li>
            <li>
              <a href="https://s3taku.com/">s3taku</a>
            </li>
          </ul>
        </div>

        <div className={styles.license}>
          <h2>License</h2>
          <p>
            InkNest is licensed under the{' '}
            <a href="https://github.com/p2devs/InkNest/blob/main/LICENSE">
              {' '}
              GNU GPLv3
            </a>
            .
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
