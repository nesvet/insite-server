import { StatefulPromise } from "@nesvet/n";
import { createServer, type AbilitiesSchema } from "insite-common/backend";
import { init as initConfig } from "insite-config";
import { CookieSetter, InSiteCookieMiddleware } from "insite-cookie/server";
import {
	connect,
	type InSiteCollections,
	type InSiteDB,
	type MongoClient
} from "insite-db";
import {
	InSiteHTTPServer,
	InSiteServerMiddleware,
	InSiteStaticMiddleware,
	InSiteTemplateMiddleware
} from "insite-http";
import { SubscriptionHandler } from "insite-subscriptions-server/ws";
import { Users } from "insite-users-server";
import { UsersServer, type WSSCWithUser } from "insite-users-server-ws";
import { IncomingTransport, OutgoingTransport } from "insite-ws-transfers/node";
import { InSiteWebSocketServer } from "insite-ws/server";
import type {
	InSiteConfig,
	InSiteWebSocketServerWithActualProps,
	OmitRedundant,
	Options
} from "./types";


export class InSite<AS extends AbilitiesSchema, O extends Options<AS>> {
	constructor(options?: O) {
		if (options)
			this.init(options);
		
	}
	
	mongoClient!: MongoClient;
	db!: InSiteDB;
	config!: InSiteConfig<O>;
	collections!: InSiteCollections;
	wss!: InSiteWebSocketServerWithActualProps<AS, O>;
	incomingTransport!: IncomingTransport<WSSCWithUser<AS>>;
	outgoingTransport!: OutgoingTransport<WSSCWithUser<AS>>;
	subscriptionHandler!: SubscriptionHandler<AS>;
	usersServer!: UsersServer<AS>;
	users!: Users<AS>;
	cookie!: CookieSetter<AS>;
	http!: InSiteHTTPServer;
	
	#isInited = false;
	
	protected async init(options: O) {
		
		if (!this.#isInited) {
			this.#isInited = true;
			
			const {
				db: dbOptions,
				config: configSchema,
				ssl,
				port,
				wss: wssWithOtherOptions,
				users: usersWithServerOptions,
				cookie: cookieWithMiddlewareOptions,
				http: httpWithMiddlewareOptions
			} = options;
			
			if (dbOptions)
				({
					client: this.mongoClient,
					db: this.db,
					collections: this.collections
				} = await connect(dbOptions));
			
			if (this.collections && configSchema)
				this.config = await initConfig(this.collections, configSchema) as InSiteConfig<O>;
			
			const server =
				port && (wssWithOtherOptions || httpWithMiddlewareOptions) ?
					await createServer({
						...wssWithOtherOptions && InSiteWebSocketServer.makeProps({ ...wssWithOtherOptions, ssl }),
						...httpWithMiddlewareOptions && InSiteHTTPServer.makeProps({ ...typeof httpWithMiddlewareOptions == "object" ? httpWithMiddlewareOptions : {}, ssl })
					}, port) :
					undefined;
			
			if (wssWithOtherOptions) {
				const {
					subscriptions,
					incomingTransport: incomingTransportOptions,
					outgoingTransport,
					...wssOptions
				} = wssWithOtherOptions;
				
				this.wss = new InSiteWebSocketServer<WSSCWithUser<AS>>({
					server,
					...wssOptions
				}) as InSiteWebSocketServerWithActualProps<AS, O>;
				
				if (subscriptions !== null)
					this.subscriptionHandler = new SubscriptionHandler(this.wss, !!this.collections);
				
				if (incomingTransportOptions !== null && (incomingTransportOptions || (this.collections && usersWithServerOptions)))
					this.incomingTransport = new IncomingTransport(this.wss, !incomingTransportOptions || incomingTransportOptions === true ? {} : incomingTransportOptions);
				
				if (outgoingTransport)
					this.outgoingTransport = new OutgoingTransport(this.wss);
				
				if (process.env.NODE_ENV === "development")
					this.wss.on("client-connect", wssc => console.info(`🔌 WebSocket connected with ${wssc.session?.user.email}`));
				
				this.wss.on("error", (error: Error) => console.error("🔌❗️ WebSocket Server:", error));
				this.wss.on("close", () => console.error("🔌❗️ WebSocket Server closed"));
			}
			
			if (usersWithServerOptions && this.collections) {
				const { server: usersServerOptions, ...usersOptions } = usersWithServerOptions;
				
				if (this.wss && this.subscriptionHandler) {
					this.usersServer = await UsersServer.init({
						...usersServerOptions,
						users: usersOptions,
						wss: this.wss,
						collections: this.collections,
						incomingTransport: this.incomingTransport
					});
					
					this.users = this.usersServer.users;
				} else
					this.users = await Users.init(this.collections, usersOptions);
			}
			
			if (httpWithMiddlewareOptions) {
				const {
					static: staticMiddlewareOptions = undefined, // eslint-disable-line unicorn/no-useless-undefined
					middlewares = undefined, // eslint-disable-line unicorn/no-useless-undefined
					template: templateMiddlewareOptions = undefined, // eslint-disable-line unicorn/no-useless-undefined
					...httpOptions
				} = typeof httpWithMiddlewareOptions == "object" ? httpWithMiddlewareOptions : {};
				
				this.http = new InSiteHTTPServer({
					server,
					...httpOptions
				}, [
					...middlewares ?? [],
					cookieWithMiddlewareOptions !== null && new InSiteCookieMiddleware(cookieWithMiddlewareOptions?.middleware ?? {}),
					staticMiddlewareOptions !== null && new InSiteStaticMiddleware(staticMiddlewareOptions ?? {}),
					templateMiddlewareOptions !== null && new InSiteTemplateMiddleware(templateMiddlewareOptions ?? {})
				].filter(Boolean) as InSiteServerMiddleware[]);
			}
			
			if (cookieWithMiddlewareOptions !== null && this.usersServer && this.http) {
				const {
					middleware: _,
					...cookieOptions
				} = cookieWithMiddlewareOptions ?? {};
				
				this.cookie = new CookieSetter<AS>({
					...cookieOptions,
					usersServer: this.usersServer
				});
			}
			
			this.#initPromise.resolve(this);
		}
		
	}
	
	#initPromise = new StatefulPromise<this>();
	
	whenReady() {
		return this.#initPromise;
	}
	
	
	static init<IAS extends AbilitiesSchema, IO extends Options<IAS>, IS extends InSite<IAS, IO>>(options: IO, asPromise?: true): Promise<OmitRedundant<IS, IO>>;
	static init<IAS extends AbilitiesSchema, IO extends Options<IAS>, IS extends InSite<IAS, IO>>(options: IO, asPromise: false): OmitRedundant<IS, IO>;
	static init<IAS extends AbilitiesSchema, IO extends Options<IAS>, IS extends InSite<IAS, IO>>(options: IO, asPromise = true) {
		const inSite = new InSite(options) as IS;
		
		return asPromise ?
			inSite.whenReady() :
			inSite;
	}
	
}
