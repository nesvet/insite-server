import { type CookieMiddlewareOptions, type Options as CookieSetterOptions } from "insite-cookie/server";
import { type Options as WSServerOptions } from "insite-ws/server";
import { type Options as DBOptions } from "insite-db";
import {
	type Options as HTTPServerOptions,
	InSiteServerMiddleware,
	type StaticMiddlewareOptions,
	type TemplateMiddlewareOptions
} from "insite-http";
import { type AbilitiesSchema, type Options as UsersOptions } from "insite-users-server";
import { type Options as UsersServerOptions } from "insite-users-server-ws";


export type Options<AS extends AbilitiesSchema> = {
	db?: DBOptions;
	wss?: WSServerOptions;
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
type OptionsWithUsers<AS extends AbilitiesSchema> = { users: Options<AS>["users"] } & OptionsWithDB<AS>;
type OptionsWithUsersServer<AS extends AbilitiesSchema> = { users: { server: NonNullable<Options<AS>["users"]>["server"] } } & OptionsWithUsers<AS> & OptionsWithWSS<AS>;
type OptionsWithHTTP<AS extends AbilitiesSchema> = { http: Options<AS>["http"] };
type OptionsWithCookie<AS extends AbilitiesSchema> = { cookie?: NonNullable<Options<AS>["cookie"]> } & OptionsWithHTTP<AS> & OptionsWithUsersServer<AS>;

type OptionalDB<I, O, AS extends AbilitiesSchema> = O extends OptionsWithDB<AS> ? I : Omit<I, "collections" | "db" | "mongoClient">;
type OptionalWSS<I, O, AS extends AbilitiesSchema> = O extends OptionsWithWSS<AS> ? I : Omit<I, "incomingTransport" | "subscriptionHandler" | "wss">;
type OptionalUsers<I, O, AS extends AbilitiesSchema> = O extends OptionsWithUsers<AS> ? I : Omit<I, "users">;
type OptionalUsersServer<I, O, AS extends AbilitiesSchema> = O extends OptionsWithUsersServer<AS> ? I : Omit<I, "usersServer">;
type OptionalHTTP<I, O, AS extends AbilitiesSchema> = O extends OptionsWithHTTP<AS> ? I : Omit<I, "http">;
type OptionalCookie<I, O, AS extends AbilitiesSchema> = O extends OptionsWithCookie<AS> ? I : Omit<I, "cookie">;

export type Optional<I, O, AS extends AbilitiesSchema> =
	OptionalCookie<
		OptionalHTTP<
			OptionalUsers<
				OptionalUsersServer<
					OptionalWSS<
						OptionalDB<
							I, O, AS
						>, O, AS
					>, O, AS
				>, O, AS
			>, O, AS
		>, O, AS
	>;
