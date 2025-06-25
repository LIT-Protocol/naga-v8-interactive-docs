/**
 * BackupAndRecovery.tsx
 *
 * This component details the technical workings of Lit Protocol.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../../components/layout/GreyboardWhiteBgContainer";

const BackupAndRecovery: React.FC = () => {
  const pageStyles = {
    container: {
      maxWidth: "1000px",
      margin: "0 auto",
      padding: "20px",
    },
    h1: {
      fontSize: "2.5rem",
      fontWeight: "700",
      color: "#1f2937",
      marginBottom: "24px",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: "600",
      color: "#1f2937",
      marginBottom: "16px",
      borderBottom: "1px solid #e5e7eb",
      paddingBottom: "8px",
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: "600",
      color: "#374151",
      marginTop: "24px",
      marginBottom: "12px",
    },
    p: {
      fontSize: "1rem",
      lineHeight: "1.6",
      color: "#4b5563",
      marginBottom: "16px",
    },
    ul: {
      listStyleType: "disc",
      paddingLeft: "20px",
      marginBottom: "16px",
    },
    ol: {
      listStyleType: "decimal",
      paddingLeft: "20px",
      marginBottom: "16px",
    },
    li: {
      marginBottom: "8px",
      color: "#4b5563",
    },
  };

  return (
    <div style={pageStyles.container}>
      <h1 style={pageStyles.h1}>Backup and Recovery</h1>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Intro</h2>
        <p style={pageStyles.p}>
          Staking $LITKEY provides the first level of resilience for the
          network, ensuring that should a node want to leave the network, they
          do so gracefully. For an additional layer of security, a backup and
          recovery process has been implemented to ensure that the network can
          be recovered even in the case that a threshold of the active node set
          goes permanently offline.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Verifiable Backups</h2>
        <p style={pageStyles.p}>
          All keys in the network are either root keys or derived hierarchically
          from the root keys. These root keys are generated during each
          distributed key generation process (DKG) in which each Lit node
          generates and holds a share of each key. To ensure these key shares
          are safe and can be recovered as needed, they're encrypted and backed
          up using a dedicated recovery party and verifiable encryption. The
          verifiable encryption process ensures that the ciphertext (in this
          case, each encrypted key share) meets certain properties which allow
          its public key to be used to confirm that all encrypted root key
          shares are genuine. Every time new root keys are produced, nodes
          update the backups they have stored with the new data.
        </p>
        <p style={pageStyles.p}>
          The backups ensure that if the available key shares were to ever fall
          below threshold the network could be recovered by importing the
          backups into a fresh set of nodes and decrypting them with the help of
          the node operators and the recovery party.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>The Recovery Party</h2>
        <p style={pageStyles.p}>
          To assist with the recovery process, a designated set of Recovery
          Party members are responsible for facilitating the decryption of
          encrypted root key shares. For a successful recovery, more than
          two-thirds of these members must participate—enabling a
          threshold-based decryption process that ensures no single party can
          perform recovery unilaterally.
        </p>
        <p style={pageStyles.p}>
          Each encrypted backup is further protected using a Blinder, a
          symmetric encryption key held by each node operator. This additional
          layer ensures that even if the Recovery Party is compromised, the
          backups cannot be decrypted without participation from the nodes
          themselves. During recovery, after the Recovery Party has met quorum
          and produced the necessary decryption shares, each node operator
          applies their Blinder to fully decrypt the backup.
        </p>
        <p style={pageStyles.p}>This two-step safeguard ensures that:</p>
        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            The Recovery Party alone cannot decrypt the root key shares.
          </li>
          <li style={pageStyles.li}>
            The Lit nodes alone cannot decrypt the backups without the Recovery
            Party's participation.
          </li>
          <li style={pageStyles.li}>
            Only with cooperation from both groups—Recovery Party quorum and
            node-held Blinders—can the encrypted backups be fully decrypted.
          </li>
        </ul>
        <p style={pageStyles.p}>
          This mechanism preserves the system's threshold security guarantees,
          even in the context of sensitive operations like key recovery.
        </p>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Encrypting the Backups</h2>
        <p style={pageStyles.p}>
          The process for encrypting the root key backups involves:
        </p>
        <ol style={pageStyles.ol}>
          <li style={pageStyles.li}>
            The nodes generate a public encryption key and the corresponding
            private decryption key shares using Distributed Key Generation (DKG)
            and provide each Recovery Party member with a decryption key share
            which is a private key share corresponding to the encryption key.
          </li>
          <li style={pageStyles.li}>
            This public key is used for encrypting the root keys to generate the
            backups.
          </li>
          <li style={pageStyles.li}>
            Each node generates a Blinder, which is used to apply an additional
            encryption layer to its backup.
          </li>
          <li style={pageStyles.li}>
            The encrypted backups are stored securely by the Lit Protocol
            development company.
          </li>
        </ol>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer style={{ marginTop: "32px" }}>
        <h2 style={pageStyles.h2}>Recovery Process</h2>
        <p style={pageStyles.p}>If the network needs to be restored:</p>
        <ol style={pageStyles.ol}>
          <li style={pageStyles.li}>
            Node operators spin up a new node environment and input their
            Blinder and encrypted backup. The nodes start waiting for decryption
            shares from the Recovery Party members.
          </li>
          <li style={pageStyles.li}>
            Each Recovery Party member produces a decryption share for each root
            key share by combining the root key share's ciphertext with their
            own decryption key share. Then each Recovery Party member uploads
            the decryption shares they generated to the nodes. (Note that
            decryption shares are produced by and different from decryption key
            shares).
          </li>
          <li style={pageStyles.li}>
            Each node receives such decryption shares from the Recovery Party
            members for each encrypted root key share that it holds. The
            decryption key shares a node received for a root key share are
            combined above the threshold, combined with the Blinder, to fully
            decrypt the ciphertext in the backups. Recovery, therefore, requires
            participation of ⅔ of the Recovery Party, ⅔ of the node operators,
            and ⅔ of the encrypted backups.
          </li>
          <li style={pageStyles.li}>
            With the decrypted root key shares in the new node environment, the
            network can be restored.
          </li>
        </ol>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default BackupAndRecovery;
