/**
 * This file is loaded by ponder as part of ponder dev & ponder start. In here we conditionally
 * execute each enabled plugin's handler functions in order to
 */

import config from "@/config";

import { PluginName } from "@ensnode/ensnode-sdk";

import attach_protocolAccelerationHandlers from "@/plugins/protocol-acceleration/event-handlers";
import attach_RegistrarsHandlers from "@/plugins/registrars/event-handlers";
import attach_BasenamesHandlers from "@/plugins/subgraph/plugins/basenames/event-handlers";
import attach_LineanamesHandlers from "@/plugins/subgraph/plugins/lineanames/event-handlers";
import attach_SubgraphHandlers from "@/plugins/subgraph/plugins/subgraph/event-handlers";
import attach_ThreeDNSHandlers from "@/plugins/subgraph/plugins/threedns/event-handlers";
import attach_TokenscopeHandlers from "@/plugins/tokenscope/event-handlers";

// Subgraph Plugin
if (config.plugins.includes(PluginName.Subgraph)) {
  attach_SubgraphHandlers();
}

// Basenames Plugin
if (config.plugins.includes(PluginName.Basenames)) {
  attach_BasenamesHandlers();
}

// Lineanames Plugin
if (config.plugins.includes(PluginName.Lineanames)) {
  attach_LineanamesHandlers();
}

// ThreeDNS Plugin
if (config.plugins.includes(PluginName.ThreeDNS)) {
  attach_ThreeDNSHandlers();
}

// Protocol Acceleration Plugin
if (config.plugins.includes(PluginName.ProtocolAcceleration)) {
  attach_protocolAccelerationHandlers();
}

// Registrars Plugin
if (config.plugins.includes(PluginName.Registrars)) {
  attach_RegistrarsHandlers();
}

// TokenScope Plugin
if (config.plugins.includes(PluginName.TokenScope)) {
  attach_TokenscopeHandlers();
}
