import type { CookieMiddlewareOptions, Options as CookieSetterOptions } from "insite-cookie/server";
import type { WithPublish, WithPublishCollection } from "insite-subscriptions-server/ws";
import type { InSiteWebSocketServer, Options as WSServerOptions } from "insite-ws/server";
import type { AnyProp, ExtendsOrOmit } from "@nesvet/n";
import type { AbilitiesSchema } from "insite-common";
import type { Options as DBOptions } from "insite-db";
import type {
	Middleware as HTTPServerMiddleware,
	Options as HTTPServerOptions,
	StaticMiddlewareOptions,
	TemplateMiddlewareOptions
} from "insite-http";
import type { Options as UsersOptions } from "insite-users-server";
import type { Options as UsersServerOptions, WSSCWithUser } from "insite-users-server-ws";
import type { IncomingTransportOptions } from "insite-ws-transfers";


/* eslint-disable @typescript-eslint/no-explicit-any */


type DB = DBOptions;
type WSSSubscriptions = true;
type WSSIncomingTransport = IncomingTransportOptions | true;
type WSSOutgoingTransport = true;
type WSS<AS extends AbilitiesSchema> = {
	subscriptions?: null | WSSSubscriptions;
	incomingTransport?: null | WSSIncomingTransport;
	outgoingTransport?: null | WSSOutgoingTransport;
} & WSServerOptions<WSSCWithUser<AS>>;
type UsersServer<AS extends AbilitiesSchema> = Omit<UsersServerOptions<AS>, "collections" | "incomingTransport" | "users" | "wss">;
type Users<AS extends AbilitiesSchema> = {
	server?: UsersServer<AS>;
} & UsersOptions<AS>;
type Cookie<AS extends AbilitiesSchema> = {
	middleware?: CookieMiddlewareOptions;
} & Omit<CookieSetterOptions<AS>, "usersServer">;
type HTTP = ({
	static?: null | StaticMiddlewareOptions;
	template?: null | TemplateMiddlewareOptions;
	middlewares?: HTTPServerMiddleware[];
} & HTTPServerOptions) | true;


export type Options<AS extends AbilitiesSchema> = {
	db?: DB;
	wss?: WSS<AS>;
	users?: Users<AS>;
	cookie?: Cookie<AS> | null;
	http?: HTTP;
};


type OptionsWithDB = { db: DB } & AnyProp;
type OptionsWithWSS = { wss: WSS<any> } & AnyProp;
type OptionsWithWSSSubscriptionHandler = { wss: { subscriptions?: WSSSubscriptions } & AnyProp } & AnyProp;
type OptionsWithWSSIncomingTransport = (
	({ wss: { incomingTransport: WSSIncomingTransport } & AnyProp }) |
	({ wss: { incomingTransport?: WSSIncomingTransport } & AnyProp } & OptionsWithUsers)
) & AnyProp;
type OptionsWithWSSOutgoingTransport = { wss: { outgoingTransport: WSSOutgoingTransport } & AnyProp } & AnyProp;
type OptionsWithUsers = { users: Users<any> } & AnyProp & OptionsWithDB;
type OptionsWithUsersServer = OptionsWithDB & OptionsWithUsers & OptionsWithWSSSubscriptionHandler;
type OptionsWithHTTP = { http: HTTP } & AnyProp;
type OptionsWithCookie = { cookie?: Cookie<any> } & OptionsWithHTTP & OptionsWithUsersServer;


export type InSiteWithActualProps<IS, O> =
	ExtendsOrOmit<O, OptionsWithDB, "collections" | "db" | "mongoClient",
		ExtendsOrOmit<O, OptionsWithConfig, "config",
									>
								>
							>
						>
					>
				>
			>
		>
	>;

export type InSiteConfig<O extends Options<any>> = Config<O["config"] extends ConfigSchema ? O["config"] : never>;
	O extends OptionsWithWSSSubscriptionHandler ?
		O extends OptionsWithDB ?
			WithPublishCollection<InSiteWebSocketServer<WSSCWithUser<AS>>, AS> :
			WithPublish<InSiteWebSocketServer<WSSCWithUser<AS>>, AS> :
		InSiteWebSocketServer<WSSCWithUser<AS>>;
