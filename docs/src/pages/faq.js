import React, { useState } from 'react';
import Layout from '@theme/Layout';
import styles from './faq.module.css';

const faqData = [
  {
    category: 'General',
    icon: '',
    questions: [
      {
        q: 'What is InkNest?',
        a: `InkNest is a free, open-source mobile application for reading comics and manga. It offers a vast library of content across genres like superheroes, sci-fi, fantasy, and more. Available on both Android and iOS, InkNest provides a seamless reading experience with features like offline reading, progress tracking, and bookmarks.`,
      },
      {
        q: 'What are the main features of InkNest?',
        a: `InkNest includes many powerful features:

• **Vast Comic & Manga Library** - Access content from multiple sources
• **Reading Progress Tracking** - Automatically saves your progress for both online and downloaded comics
• **Offline Reading with Sync** - Download comics and sync missing files
• **CBZ/CBR/ZIP/RAR Reader** - Import and read your own comic files
• **Bookmarks & History** - Keep track of favorites and reading history
• **Push Notifications** - Stay updated with new releases
• **Multi-Platform Support** - Available on Android and iOS
• **User-Friendly Interface** - Intuitive navigation and customizable settings`,
      },
      {
        q: 'Is InkNest free to use?',
        a: `Yes, InkNest is completely free and open-source! We believe in providing a great reading experience without any cost. The app is supported by our amazing community, and you can contribute by starring our GitHub repository or joining our Discord community.`,
      },
      {
        q: 'Does InkNest have an anime library?',
        a: `No, InkNest focuses exclusively on comics and manga. However, we have a dedicated application for anime enthusiasts called **Anizuno**. You can download it from our [Anizuno page](https://p2devs.github.io/Anizuno/) or the [GitHub repository](https://github.com/p2devs/Anizuno).`,
      },
    ],
  },
  {
    category: 'Installation',
    icon: '⬇️',
    questions: [
      {
        q: 'How do I install InkNest on Android?',
        a: `To install InkNest on Android:

1. **Download the APK** - Get the latest version from our [releases page](https://github.com/p2devs/InkNest/releases)
2. **Enable Unknown Sources** - Go to Settings → Security/Privacy → Enable "Install from unknown sources"
3. **Install the APK** - Open the downloaded file and tap "Install"
4. **Open InkNest** - Find the app in your app drawer and start reading!

*Note: You may need to grant additional permissions for the app to function properly.*`,
      },
      {
        q: 'How do I install InkNest on iOS?',
        a: `To install InkNest on iOS via TestFlight:

1. **Install TestFlight** - Download from the [App Store](https://apps.apple.com/app/testflight/id899247664)
2. **Join Beta Program** - Open our [TestFlight invitation link](https://testflight.apple.com/join/VejlezL5)
3. **Accept Invitation** - Follow the prompts to join the beta
4. **Install InkNest** - Tap "Install" in the TestFlight app
5. **Start Reading** - Find InkNest on your home screen

*TestFlight will automatically notify you of updates!*`,
      },
    ],
  },
  {
    category: 'Features',
    icon: '✨',
    questions: [
      {
        q: 'Can I download comics for offline reading?',
        a: `Yes! InkNest v1.4.1 has enhanced offline reading capabilities:

• **Download any comic/manga** - Save content for offline access
• **Sync Downloads** - If files go missing, use the "Sync Downloads" feature to restore them
• **Progress Tracking** - Your reading progress is saved even for downloaded content
• **Manage Downloads** - View and manage all your downloaded content in the Library`,
      },
      {
        q: 'Can I read my own comic files (CBZ/CBR)?',
        a: `Yes! As of v1.4.0, InkNest supports reading local comic files:

• **Supported Formats** - CBZ, CBR, ZIP, and RAR files
• **Import Files** - Open comic files directly from your device's file manager
• **iOS Support** - Full support for opening files from the Files app
• **Progress Tracking** - Your reading progress is saved for imported comics too
• **Library Integration** - Imported comics appear in your Library for easy access`,
      },
      {
        q: 'How does reading progress tracking work?',
        a: `InkNest v1.4.1 features enhanced progress tracking:

• **Automatic Saving** - Your reading position is saved automatically
• **Works Everywhere** - Progress is tracked for online, downloaded, and imported comics
• **History View** - See all your reading history with progress indicators
• **Continue Reading** - Easily pick up where you left off from the Library screen
• **Sync Support** - Progress is preserved even when re-syncing downloads`,
      },
    ],
  },
  {
    category: 'Troubleshooting',
    icon: '🔧',
    questions: [
      {
        q: 'How do I report bugs or issues?',
        a: `You can report issues through multiple channels:

• **GitHub Issues** - Create a detailed bug report on our [Issues page](https://github.com/p2devs/InkNest/issues)
• **Discord** - Report issues in our [Discord server](https://discord.gg/WYwJefvWNT)
• **Email** - Contact us at [inknest@capacity.rocks](mailto:inknest@capacity.rocks)
• **TestFlight** - iOS users can send feedback directly through TestFlight

*Please include device info, app version, and steps to reproduce the issue!*`,
      },
      {
        q: 'My downloaded comics are missing. What should I do?',
        a: `InkNest v1.4.1 includes a Sync Downloads feature for this:

1. Go to your **Downloaded Comics** section
2. If files are missing, you'll see a **"Sync Downloads"** option
3. Tap to restore missing files automatically
4. Your reading progress will be preserved

*This feature detects missing local files and re-downloads them while keeping your progress intact.*`,
      },
      {
        q: 'The app is crashing or not working properly. What should I do?',
        a: `Try these troubleshooting steps:

1. **Update the App** - Make sure you have the latest version (v1.4.1)
2. **Clear Cache** - Go to your device settings and clear the app cache
3. **Reinstall** - Uninstall and reinstall the app
4. **Check Internet** - Ensure you have a stable connection for online content
5. **Report the Issue** - If problems persist, report on GitHub or Discord with details

*Include your device model, OS version, and app version when reporting!*`,
      },
    ],
  },
  {
    category: 'Contributing',
    icon: '🤝',
    questions: [
      {
        q: 'How can I contribute to InkNest?',
        a: `We welcome contributions from the community! Here's how you can help:

• **Code Contributions** - Fork the repo, make changes, and submit a pull request
• **Bug Reports** - Report issues on [GitHub Issues](https://github.com/p2devs/InkNest/issues)
• **Feature Requests** - Share ideas in [GitHub Discussions](https://github.com/p2devs/InkNest/discussions)
• **Community Support** - Help others on Discord
• **Star the Repo** - Show your support on [GitHub](https://github.com/p2devs/InkNest)
• **Spread the Word** - Share InkNest with friends!`,
      },
      {
        q: 'How can I contact the InkNest team?',
        a: `Reach out through any of these channels:

• **Email** - [inknest@capacity.rocks](mailto:inknest@capacity.rocks)
• **Discord** - Join our [Discord server](https://discord.gg/WYwJefvWNT) for real-time chat
• **GitHub Discussions** - [Ask questions](https://github.com/p2devs/InkNest/discussions) and share ideas
• **GitHub Issues** - For bug reports and feature requests

*We're here to help and always appreciate feedback!*`,
      },
    ],
  },
];

function FAQItem({ question, answer, isOpen, onClick }) {
  return (
    <div className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}>
      <button className={styles.faqQuestion} onClick={onClick}>
        <span>{question}</span>
        <span className={styles.faqIcon}>{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className={styles.faqAnswer}>
          <div dangerouslySetInnerHTML={{ 
            __html: answer
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
              .replace(/\n\n/g, '</p><p>')
              .replace(/\n•/g, '<br/>•')
              .replace(/\n(\d\.)/g, '<br/>$1')
              .replace(/^\*(.+)\*$/gm, '<em>$1</em>')
          }} />
        </div>
      )}
    </div>
  );
}

function FAQCategory({ category, icon, questions, openItems, toggleItem }) {
  return (
    <div className={styles.faqCategory}>
      <h2 className={styles.categoryTitle}>
        <span className={styles.categoryIcon}>{icon}</span>
        {category}
      </h2>
      <div className={styles.faqList}>
        {questions.map((item, index) => (
          <FAQItem
            key={index}
            question={item.q}
            answer={item.a}
            isOpen={openItems[`${category}-${index}`]}
            onClick={() => toggleItem(`${category}-${index}`)}
          />
        ))}
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (key) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => {
    const allOpen = {};
    faqData.forEach((category) => {
      category.questions.forEach((_, index) => {
        allOpen[`${category.category}-${index}`] = true;
      });
    });
    setOpenItems(allOpen);
  };

  const collapseAll = () => {
    setOpenItems({});
  };

  return (
    <Layout
      title="FAQ"
      description="Frequently Asked Questions about InkNest - Your ultimate comic and manga reader">
      <main className={styles.faqPage}>
        <div className={styles.heroSection}>
          <h1 className={styles.heroTitle}>❓ Frequently Asked Questions</h1>
          <p className={styles.heroSubtitle}>
            Find answers to common questions about InkNest
          </p>
          <div className={styles.heroButtons}>
            <button onClick={expandAll} className={styles.expandButton}>
              Expand All
            </button>
            <button onClick={collapseAll} className={styles.collapseButton}>
              Collapse All
            </button>
          </div>
        </div>

        <div className={styles.container}>
          {faqData.map((category, index) => (
            <FAQCategory
              key={index}
              category={category.category}
              icon={category.icon}
              questions={category.questions}
              openItems={openItems}
              toggleItem={toggleItem}
            />
          ))}

          <div className={styles.stillNeedHelp}>
            <h2>🙋 Still have questions?</h2>
            <p>Can't find what you're looking for? Reach out to us!</p>
            <div className={styles.helpButtons}>
              <a
                href="https://discord.gg/WYwJefvWNT"
                className={styles.helpButton}
                target="_blank"
                rel="noopener noreferrer">
                💬 Join Discord
              </a>
              <a
                href="https://github.com/p2devs/InkNest/discussions"
                className={styles.helpButton}
                target="_blank"
                rel="noopener noreferrer">
                💡 GitHub Discussions
              </a>
              <a
                href="mailto:inknest@capacity.rocks"
                className={styles.helpButton}>
                📧 Email Us
              </a>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
