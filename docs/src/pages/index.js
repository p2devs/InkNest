import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import axios from 'axios';

import styles from './index.module.css';
import React, { useLayoutEffect, useState } from 'react';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
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
        <h2 className={styles.subtitle}>{siteConfig.tagline}</h2>
        <p className={styles.description}>
          InkNest is your ultimate app for enjoying a vast collection of comic books and anime right on your mobile device, completely free of charge. Dive into a universe where you can explore thrilling adventures, captivating stories, and stunning artwork from a wide range of genres and publishers. Whether you're into superheroes, sci-fi, fantasy, manga, or anime, InkNest offers a seamless reading and viewing experience with user-friendly navigation and customizable settings to enhance your enjoyment. Stay updated with the latest releases and classics alike.
        </p>
        <p className={styles.description}>
          Discover, read, watch, and immerse yourself in the world of comics and anime with InkNest, designed for enthusiasts of all ages. Enjoy content from popular anime studios like Studio Ghibli, Toei Animation, and Madhouse, as well as renowned comic publishers such as Marvel, DC Comics, and Dark Horse. With InkNest, your favorite stories and characters are always at your fingertips.
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
