import type { CookieMiddlewareOptions, Options as CookieSetterOptions } from "insite-cookie/server";
import type { WithPublish, WithPublishCollection } from "insite-subscriptions-server/ws";
import type { InSiteWebSocketServer, Options as WSServerOptions } from "insite-ws/server";
import type { Options as DBOptions } from "insite-db";
import type {
	Options as HTTPServerOptions,
	InSiteServerMiddleware,
	StaticMiddlewareOptions,
	TemplateMiddlewareOptions
} from "insite-http";
import type { AbilitiesSchema, Options as UsersOptions } from "insite-users-server";
import type { Options as UsersServerOptions, WSSCWithUser } from "insite-users-server-ws";
import type { IncomingTransportOptions } from "insite-ws-transfers";


export type Options<AS extends AbilitiesSchema> = {
	db?: DBOptions;
	wss?: {
		subscriptions?: null | true;
		incomingTransport?: IncomingTransportOptions | null;
		outgoingTransport?: null | true;
	} & WSServerOptions<WSSCWithUser<AS>>;
	users?: {
		server?: Omit<UsersServerOptions<AS>, "collections" | "incomingTransport" | "users" | "wss">;
	} & UsersOptions<AS>;
	cookie?: ({
		middleware?: CookieMiddlewareOptions;
	} & Omit<CookieSetterOptions<AS>, "usersServer">) | null | undefined;
	http?: ({
		static?: null | StaticMiddlewareOptions;
		template?: null | TemplateMiddlewareOptions;
		middlewares?: InSiteServerMiddleware[];
	} & HTTPServerOptions) | true;
};

type OptionsWithDB<AS extends AbilitiesSchema> = { db: Options<AS>["db"] };
type OptionsWithWSS<AS extends AbilitiesSchema> = { wss: Options<AS>["wss"] };
type OptionsWithWSSSubscriptionHandler<AS extends AbilitiesSchema> = { wss: { subscriptions?: NonNullable<NonNullable<Options<AS>["wss"]>["subscriptions"]> } & Options<AS>["wss"] };
type OptionsWithWSSIncomingTransport<AS extends AbilitiesSchema> =
	{ wss: { incomingTransport: NonNullable<NonNullable<Options<AS>["wss"]>["incomingTransport"]> } & Options<AS>["wss"] } |
	({ wss: { incomingTransport?: NonNullable<NonNullable<Options<AS>["wss"]>["incomingTransport"]> } & Options<AS>["wss"] } & OptionsWithUsers<AS>);
type OptionsWithWSSOutgoingTransport<AS extends AbilitiesSchema> = { wss: { outgoingTransport: NonNullable<NonNullable<Options<AS>["wss"]>["outgoingTransport"]> } & Options<AS>["wss"] };
type OptionsWithUsers<AS extends AbilitiesSchema> = { users: Options<AS>["users"] } & OptionsWithDB<AS>;
type OptionsWithUsersServer<AS extends AbilitiesSchema> = OptionsWithUsers<AS> & OptionsWithWSSSubscriptionHandler<AS>;
type OptionsWithHTTP<AS extends AbilitiesSchema> = { http: Options<AS>["http"] };
type OptionsWithCookie<AS extends AbilitiesSchema> = { cookie?: NonNullable<Options<AS>["cookie"]> } & OptionsWithHTTP<AS> & OptionsWithUsersServer<AS>;

type OptionalDB<I, O, AS extends AbilitiesSchema> = O extends OptionsWithDB<AS> ? I : Omit<I, "collections" | "db" | "mongoClient">;
type OptionalWSS<I, O, AS extends AbilitiesSchema> = O extends OptionsWithWSS<AS> ? I : Omit<I, "subscriptionHandler" | "wss">;
type OptionalWSSSubscriptionHandler<I, O, AS extends AbilitiesSchema> = O extends OptionsWithWSSSubscriptionHandler<AS> ? I : Omit<I, "subscriptionHandler">;
type OptionalWSSIncomingTransport<I, O, AS extends AbilitiesSchema> = O extends OptionsWithWSSIncomingTransport<AS> ? I : Omit<I, "incomingTransport">;
type OptionalWSSOutgoingTransport<I, O, AS extends AbilitiesSchema> = O extends OptionsWithWSSOutgoingTransport<AS> ? I : Omit<I, "outgoingTransport">;
type OptionalUsers<I, O, AS extends AbilitiesSchema> = O extends OptionsWithUsers<AS> ? I : Omit<I, "users">;
type OptionalUsersServer<I, O, AS extends AbilitiesSchema> = O extends OptionsWithUsersServer<AS> ? I : Omit<I, "usersServer">;
type OptionalHTTP<I, O, AS extends AbilitiesSchema> = O extends OptionsWithHTTP<AS> ? I : Omit<I, "http">;
type OptionalCookie<I, O, AS extends AbilitiesSchema> = O extends OptionsWithCookie<AS> ? I : Omit<I, "cookie">;

export type Optional<I, O, AS extends AbilitiesSchema> =
	OptionalCookie<
		OptionalHTTP<
			OptionalUsers<
				OptionalUsersServer<
					OptionalWSSSubscriptionHandler<
						OptionalWSSIncomingTransport<
							OptionalWSSOutgoingTransport<
								OptionalWSS<
									OptionalDB<
										I, O, AS
									>, O, AS
								>, O, AS
							>, O, AS
						>, O, AS
					>, O, AS
				>, O, AS
			>, O, AS
		>, O, AS
	>;

export type WSS<AS extends AbilitiesSchema, O> =
	O extends OptionsWithWSSSubscriptionHandler<AS> ?
		O extends OptionsWithDB<AS> ?
			WithPublishCollection<InSiteWebSocketServer<WSSCWithUser<AS>>, AS> :
			WithPublish<InSiteWebSocketServer<WSSCWithUser<AS>>, AS> :
		InSiteWebSocketServer<WSSCWithUser<AS>>;
