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
        <h2 className={styles.subtitle}>{siteConfig.tagline}</h2>
        <p className={styles.description}>
          InkNest is your go-to app for enjoying a vast collection of comic
          books right on your mobile device, completely free of charge. Dive
          into a universe where you can explore thrilling adventures,
          captivating stories, and stunning artwork from a wide range of genres
          and publishers. Whether you're into superheroes, sci-fi, fantasy, or
          manga, InkNest offers a seamless reading experience with user-friendly
          navigation and customizable settings to enhance your enjoyment. Stay
          updated with the latest releases and classics alike, all conveniently
          accessible offline once downloaded. Discover, read, and immerse
          yourself in the world of comics with InkNest, designed for comic
          enthusiasts of all ages.
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
