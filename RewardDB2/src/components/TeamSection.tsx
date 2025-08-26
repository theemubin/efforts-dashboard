import React from 'react';
import styles from './TeamSection.module.css';
import { FaTwitter, FaFacebook, FaVimeo } from 'react-icons/fa';

const teamMembers = [
  {
    name: 'KHAN SAHEB',
    role: 'HR, LATO',
    image: 'https://cdn.easyfrontend.com/pictures/team/team_13_1.jpg',
    socials: [
      { icon: <FaTwitter />, url: '#' },
      { icon: <FaFacebook />, url: '#' },
      { icon: <FaVimeo />, url: '#' },
    ],
  },
  {
    name: 'Ali Akbar',
    role: 'HR, PIT',
    image: 'https://cdn.easyfrontend.com/pictures/team/team_13_2.jpg',
    socials: [
      { icon: <FaTwitter />, url: '#' },
      { icon: <FaFacebook />, url: '#' },
      { icon: <FaVimeo />, url: '#' },
    ],
  },
  {
    name: 'Sadab Bean',
    role: 'HR, INCA',
    image: 'https://cdn.easyfrontend.com/pictures/team/team_13_3.jpg',
    socials: [
      { icon: <FaTwitter />, url: '#' },
      { icon: <FaFacebook />, url: '#' },
      { icon: <FaVimeo />, url: '#' },
    ],
  },
];

const TeamSection: React.FC = () => (
  <section className={styles.teamSection}>
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.heading}>Our Team</h3>
        <p className={styles.subHeading}>Lorem ipsum dolor sit amet consectetur adipiscing elit.</p>
      </div>
      <div className={styles.teamGrid}>
        {teamMembers.map((member, idx) => (
          <div className={styles.card} key={idx}>
            <div className={styles.cardInner}>
              <img src={member.image} alt={member.name} className={styles.image} />
              <div className={styles.cardContent}>
                <h3 className={styles.title}>{member.name}</h3>
                <p className={styles.role}>{member.role}</p>
                <div className={styles.socialArea}>
                  <ul className={styles.socialList}>
                    {member.socials.map((social, i) => (
                      <li key={i}>
                        <a href={social.url} target="_blank" rel="noopener noreferrer">
                          {social.icon}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TeamSection;
