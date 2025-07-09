/**
 * LitNetworks.tsx
 *
 * This component provides comprehensive documentation about the various Lit networks
 * available (Naga, Naga-test, and Naga-dev), including their purposes, features,
 * and usage guidelines for developers.
 */

import React from "react";
import GreyBoarderWhiteBgContainer from "../../components/layout/GreyboardWhiteBgContainer";
import {
  LinkExternal,
  NoteCallout,
  WarningCallout,
} from "../../components/common";
import { pageStyles } from "../../styles/pageStyles";
import { Link } from "react-router-dom";

const LitNetworks: React.FC = () => {
  return (
    <div className="tab-content">
      <h1 style={pageStyles.h1}>Lit Networks</h1>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Overview</h2>
        <p style={pageStyles.p}>
          Lit Protocol offers multiple networks tailored to different stages of
          development - from early testing to full production. Each network has
          its own characteristics for data persistence, decentralization, and
          payment enforcement. Choose the network that best matches your current
          development phase.
        </p>

        <WarningCallout
          title="Don't store valuable assets on test networks"
          message={
            <>
              Only <strong>Naga Mainnet</strong> offers persistent key storage
              and production-grade guarantees. Test networks may be deprecated
              or reset at any time.
            </>
          }
        />
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Naga Dev</h2>
        <h3 style={pageStyles.h3}>
          🛠️ Best for early stage development and learning
        </h3>

        <p style={pageStyles.p}>
          Naga Dev is a centralized testnet where all the Lit nodes are ran by
          the Lit Protocol team. Use this network when getting started with Lit,
          and to try out the different features of the protocol.
        </p>

        <ul style={pageStyles.ul}>
          <li style={pageStyles.li}>
            <LinkExternal href={`https://${import.meta.env.VITE_LIT_NETWORK || "naga-dev"}-status.getlit.dev/`}>
              Network Status Page
            </LinkExternal>
          </li>
          <li style={pageStyles.li}>
            <strong>No payments required:</strong> Payment for network use is
            not enabled on this network, however you will still need{" "}
            <code>$LITKEY</code> test tokens for minting PKPs.
          </li>
          <li style={pageStyles.li}>
            <strong>Non-persistent:</strong> PKPs and chain data may be deleted
            at any time, <strong>do not</strong> store any assets with real
            world value here, or use for long-term storage.
          </li>
        </ul>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Naga Test</h2>

        <div style={{ marginBottom: "32px" }}>
          <h3 style={pageStyles.h3}>
            🧪 For pre-production development and testing
          </h3>
          <p style={pageStyles.p}>
            Naga Test is a decentralized test network that closely mirrors the
            production environment. It includes payment enforcement and provides
            a more realistic testing experience. Use this when you're ready to
            test in production-like conditions.
          </p>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Payment required:</strong> Naga Test enforces payment
              using <code>$LITKEY</code> test tokens deposited into the{" "}
              <Link to="/paying-for-lit/overview" style={pageStyles.link}>
                Lit Ledger contract
              </Link>
              , providing a realistic testing environment for production
              applications.
            </li>
            <li style={pageStyles.li}>
              <strong>Non-persistent data:</strong> Naga Test is still a test
              network and may be deprecated in the future,{" "}
              <strong>do not</strong> store any assets with real world value
              here, or use for long-term storage.
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>

      <GreyBoarderWhiteBgContainer>
        <h2 style={pageStyles.h2}>Naga Mainnet</h2>

        <div style={{ marginBottom: "32px" }}>
          <h3 style={pageStyles.h3}>🏭 For production applications</h3>

          <NoteCallout
            variant="note"
            title="Coming soon"
            message={
              <>
                Naga Mainnet is not live yet, follow{" "}
                <LinkExternal href="https://x.com/LitProtocol">
                  Lit Protocol on X
                </LinkExternal>{" "}
                for launch updates.
              </>
            }
          />

          <p style={pageStyles.p}>
            Naga Mainnet is the fully decentralized, production-grade Lit
            Network. It's the only network where keys are persistent and
            guaranteed, making it suitable for apps handling real-world value.
          </p>
          <ul style={pageStyles.ul}>
            <li style={pageStyles.li}>
              <strong>Payment required:</strong> Naga Mainnet enforces payment
              using <code>$LITKEY</code> tokens deposited into the{" "}
              <Link to="/paying-for-lit/overview" style={pageStyles.link}>
                Lit Ledger contract
              </Link>
              , to pay for requests to the Lit Network.
            </li>
          </ul>
        </div>
      </GreyBoarderWhiteBgContainer>
    </div>
  );
};

export default LitNetworks;
