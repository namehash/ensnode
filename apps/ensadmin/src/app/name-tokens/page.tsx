"use client";

import { keepPreviousData } from "@tanstack/react-query";

import { useNameTokens } from "@ensnode/ensnode-react";
import { Name, NameTokensResponseCodes, NameTokensResponseErrorCodes } from "@ensnode/ensnode-sdk";

import { AbsoluteTime } from "@/components/datetime-utils";

interface FetchAndDisplayNameTokenProps {
  name: Name;
}

function FetchAndDisplayNameToken({ name }: FetchAndDisplayNameTokenProps) {
  const nameTokens = useNameTokens({
    name,
    query: {
      placeholderData: keepPreviousData,
    },
  });

  if (nameTokens.isError) {
    return (
      <p title={`Error message: ${nameTokens.error.message}`}>
        Cannot display name tokens for "{name}" name.
      </p>
    );
  }
  if (nameTokens.isPending) {
    return <p className="animate-pulse">Loading</p>;
  }

  if (nameTokens.data.responseCode === NameTokensResponseCodes.Error) {
    switch (nameTokens.data.errorCode) {
      case NameTokensResponseErrorCodes.NameNotIndexed:
        return (
          <p title={`Error message: ${nameTokens.data.error.message}}`}>
            Cannot display name tokens for an unknown "{name}"" name
          </p>
        );
      case NameTokensResponseErrorCodes.EnsIndexerConfigUnsupported:
      case NameTokensResponseErrorCodes.IndexingStatusUnsupported:
        return (
          <p title={`Error message: ${nameTokens.data.error.message}}`}>
            Cannot display name tokens for "{name}" name.
          </p>
        );
    }
  }

  return (
    <div className="p-6">
      <strong>
        {name}{" "}
        <small>
          (accurate as of{" "}
          <AbsoluteTime
            timestamp={nameTokens.data.registeredNameTokens.accurateAsOf}
            options={{
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
              hour12: true,
            }}
          />
          )
        </small>
      </strong>
      <details>
        <summary>Name tokens</summary>

        <pre>
          {JSON.stringify(
            nameTokens.data.registeredNameTokens,
            (_, v) => (typeof v === "bigint" ? v.toString() : v),
            2,
          )}
        </pre>
      </details>
    </div>
  );
}

function FetchAndDisplayNameTokens() {
  const wrappedNames: Name[] = [
    "texasprivacy.eth",
    "texasremit.eth",
    "txprivacy.eth",
    "txremit.eth",
    "capitalprivacy.eth",
    "treasuryprivacy.eth",
    "banksovereign.eth",
    "gomurphy.eth",
    "fhelab.eth",
    "walletmint.eth",
    "bankcbdc.eth",
    "debpani.eth",
    "privwallet.eth",
    "gpcmp.eth",
    "sovereign-bank.eth",
    "privcap.eth",
    "datprivacy.eth",
    "wealth-bank.eth",
    "quirkoracle.eth",
    "studiozone.eth",
    "transparencyprotocol.eth",
    "thrivetitan.eth",
    "leofx.eth",
    "wizghost.eth",
    "elite-mentorship-trainers.eth",
    "signalvision.eth",
    "orbitsphere.eth",
    "fusionzone.eth",
    "neolinked.eth",
    "empireofjapan.eth",
    "networksentry.eth",
    "cranss.eth",
    "laiwyers.eth",
    "bankprivacy.eth",
    "fondosdeliquidez.eth",
    "cryptoinfinityx.eth",
    "hydraprime.eth",
    "vertexneo.eth",
    "peaknoded.eth",
    "nodeether.eth",
    "phoenixpath.eth",
    "wizpeak.eth",
    "6986a.eth",
    "0e652.eth",
    "0xc128d21c36a7706684a3ab9bb5f5ecaf6f33134b.eth",
    "ba07a.eth",
    "ddnss.eth",
    "nazarkin.eth",
    "xrpfiprivacy.eth",
    "xrplodl.eth",
  ].filter((_, idx) => idx < 5);

  return wrappedNames.map((wrappedName) => (
    <FetchAndDisplayNameToken key={wrappedName} name={wrappedName} />
  ));
}

export default function NameTokensPage() {
  return <FetchAndDisplayNameTokens />;
}
