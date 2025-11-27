import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import axios from 'axios';

import styles from './index.module.css';
import React, {useLayoutEffect, useState} from 'react';

const features = [
  {
    icon: '📚',
    title: 'Vast Comic & Manga Library',
    description: 'Access a wide range of comics & manga across various genres including superheroes, sci-fi, fantasy, and more.',
  },
  {
    icon: '📖',
    title: 'Reading Progress Tracking',
    description: 'Your reading progress is automatically saved for both online and downloaded comics.',
  },
  {
    icon: '🔖',
    title: 'Bookmark & History',
    description: 'Bookmark your favorites and track your reading history for easy access.',
  },
  {
    icon: '📥',
    title: 'Offline Reading',
    description: 'Download comics & manga for offline reading with sync support to restore missing files.',
  },
  {
    icon: '📁',
    title: 'CBZ & CBR Reader',
    description: 'Import and read your own CBZ, CBR, ZIP, and RAR comic files directly from your device.',
  },
  {
    icon: '🔍',
    title: 'Search & Discover',
    description: 'Easily find comics & manga with powerful search functionality and explore curated collections.',
  },
  {
    icon: '🔔',
    title: 'Push Notifications',
    description: 'Stay informed about new releases and updates with push notifications.',
  },
  {
    icon: '🎨',
    title: 'User-Friendly Interface',
    description: 'Intuitive and easy-to-use navigation ensures a seamless reading experience.',
  },
  {
    icon: '📱',
    title: 'Multi-Platform',
    description: 'Available on both Android and iOS devices with a consistent experience.',
  },
  {
    icon: '💻',
    title: 'Open Source',
    description: 'InkNest is open source, allowing users to contribute and improve the app.',
  },
  {
    icon: '👥',
    title: 'Community Support',
    description: 'Join our community on Discord for real-time support and discussion.',
  },
  {
    icon: '🆕',
    title: 'Regular Updates',
    description: 'Stay up-to-date with new features, sources, and improvements.',
  },
];

const techStack = [
  {
    name: 'React Native',
    description: 'Framework',
    url: 'https://reactnative.dev/',
  },
  {
    name: 'Redux',
    description: 'State management',
    url: 'https://redux.js.org/',
  },
  {
    name: 'Firebase',
    description: 'Backend services',
    url: 'https://firebase.google.com/',
  },
  {
    name: 'Docusaurus',
    description: 'Documentation',
    url: 'https://docusaurus.io/',
  },
];

function HeroSection({updateLogs}) {
  const {siteConfig} = useDocusaurusContext();

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContent}>
        <h1 className={styles.title}>{siteConfig.title}</h1>
        <h2 className={styles.subtitle}>{siteConfig.tagline}</h2>
        
        <p className={styles.description}>
          InkNest is a free mobile app offering a vast collection of comics and
          manga across genres like superheroes, sci-fi, fantasy, and manga.
          Enjoy a seamless experience with user-friendly navigation and
          customizable settings.
        </p>

        <div className={styles.badges}>
          <a href="https://discord.gg/WYwJefvWNT">
            <img
              alt="Discord Chat"
              src="https://img.shields.io/discord/1281938822275403817.svg?logo=discord&logoColor=white&logoWidth=20&labelColor=7289DA&label=Discord&color=17cf48&style=for-the-badge"
            />
          </a>
          <a href="https://github.com/p2devs/InkNest/releases/latest">
            <img
              alt="GitHub release"
              src="https://img.shields.io/github/v/release/p2devs/InkNest?style=for-the-badge&color=6366f1"
            />
          </a>
          <a href="https://github.com/p2devs/InkNest">
            <img
              alt="GitHub stars"
              src="https://img.shields.io/github/stars/p2devs/InkNest?style=for-the-badge&color=fbbf24"
            />
          </a>
          <a href="https://github.com/p2devs/InkNest/blob/main/LICENSE">
            <img
              alt="License"
              src="https://img.shields.io/github/license/p2devs/InkNest?style=for-the-badge&color=22c55e"
            />
          </a>
        </div>

        <div className={styles.buttons}>
          <button
            onClick={() => window.open('https://testflight.apple.com/join/VejlezL5')}
            className={styles.downloadButton}>
            Download for iOS
          </button>
          <button
            onClick={() => window.open(updateLogs?.assets?.[0]?.browser_download_url)}
            className={styles.downloadButton}>
            Download for Android
          </button>
        </div>

        <div className={styles.noticeBox}>
          <p className={styles.starNotice}>
            🌟 Star this repository to support the developer and encourage further development!
          </p>
          <p className={styles.warningNotice}>
            ⚠️ Please do not upload InkNest or any forks to the Play Store, App Store, or other stores.
          </p>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className={`${styles.section} ${styles.sectionAlt}`}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>✨ Features</h2>
        <p className={styles.sectionSubtitle}>
          Everything you need for the ultimate comic and manga reading experience
        </p>
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TechStackSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>🛠️ Tech Stack</h2>
        <p className={styles.sectionSubtitle}>
          Built with modern technologies for the best performance
        </p>
        <div className={styles.techGrid}>
          {techStack.map((tech, index) => (
            <a
              key={index}
              href={tech.url}
              className={styles.techCard}
              target="_blank"
              rel="noopener noreferrer">
              <h4>{tech.name}</h4>
              <p>{tech.description}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function DisclaimerSection() {
  return (
    <section className={`${styles.section} ${styles.sectionAlt}`}>
      <div className={styles.container}>
        <div className={styles.disclaimerSection}>
          <h2>⚠️ Disclaimer</h2>
          <ul>
            <li>InkNest only scrapes links from various websites, making it easier for users to find manga and comics.</li>
            <li>Neither InkNest nor its developers/staff host any of the content found within the app.</li>
            <li>All manga/comic links are obtained from various third-party hosting websites.</li>
            <li>InkNest and its owners aren't liable for any misuse of the content found inside or outside the app.</li>
            <li>By using InkNest, you agree that the developers are not responsible for any content found in the app.</li>
            <li>If internet infringement issues arise, please contact the source website.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>📬 Contact</h2>
        <p className={styles.sectionSubtitle}>
          Get in touch with us through any of these channels
        </p>
        <div className={styles.contactGrid}>
          <div className={styles.contactCard}>
            <h4>📧 Email</h4>
            <a href="mailto:inknest@mail.p2devs.engineer">
              inknest@mail.p2devs.engineer
            </a>
          </div>
          <div className={styles.contactCard}>
            <h4>💬 Discord</h4>
            <a href="https://discord.gg/WYwJefvWNT" target="_blank" rel="noopener noreferrer">
              Join our Discord server
            </a>
          </div>
          <div className={styles.contactCard}>
            <h4>💡 GitHub Discussions</h4>
            <a href="https://github.com/p2devs/InkNest/discussions" target="_blank" rel="noopener noreferrer">
              Ask questions & share ideas
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection({updateLogs}) {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.ctaSection}>
          <h2>🚀 Ready to dive into comics?</h2>
          <p>Download InkNest now and start your reading adventure!</p>
          <div className={styles.buttons}>
            <button
              onClick={() => window.open('https://testflight.apple.com/join/VejlezL5')}
              className={styles.downloadButton}>
              Download for iOS
            </button>
            <button
              onClick={() => window.open(updateLogs?.assets?.[0]?.browser_download_url)}
              className={styles.downloadButton}>
              Download for Android
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContributingSection() {
  return (
    <section className={`${styles.section} ${styles.sectionAlt}`}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>🤝 Contributing</h2>
        <p className={styles.sectionSubtitle}>
          We welcome contributions! Check out our{' '}
          <a href="https://github.com/p2devs/InkNest/blob/main/CONTRIBUTING.md">
            Contributing Guidelines
          </a>{' '}
          to get started.
        </p>
        <div className={styles.techGrid}>
          <a
            href="https://github.com/p2devs/InkNest"
            className={styles.techCard}
            target="_blank"
            rel="noopener noreferrer">
            <h4>⭐ Star on GitHub</h4>
            <p>Show your support</p>
          </a>
          <a
            href="https://github.com/p2devs/InkNest/fork"
            className={styles.techCard}
            target="_blank"
            rel="noopener noreferrer">
            <h4>🍴 Fork the Repo</h4>
            <p>Start contributing</p>
          </a>
          <a
            href="https://github.com/p2devs/InkNest/issues"
            className={styles.techCard}
            target="_blank"
            rel="noopener noreferrer">
            <h4>🐛 Report Issues</h4>
            <p>Help us improve</p>
          </a>
          <a
            href="https://github.com/p2devs/InkNest/blob/main/LICENSE"
            className={styles.techCard}
            target="_blank"
            rel="noopener noreferrer">
            <h4>📄 License</h4>
            <p>GNU GPL v3</p>
          </a>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [updateLogs, setUpdateLogs] = useState({});

  useLayoutEffect(() => {
    axios
      .get('https://api.github.com/repos/p2devs/InkNest/releases/latest')
      .then(response => {
        setUpdateLogs(response?.data);
      })
      .catch(error => {
        console.log('Failed to fetch update logs:', error);
      });
  }, []);

  return (
    <Layout
      title="Home"
      description="InkNest - Your ultimate mobile companion for comics and manga">
      <main>
        <HeroSection updateLogs={updateLogs} />
        <FeaturesSection />
        <TechStackSection />
        <ContributingSection />
        <DisclaimerSection />
        <ContactSection />
        <CTASection updateLogs={updateLogs} />
      </main>
    </Layout>
  );
}
