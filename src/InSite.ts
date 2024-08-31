import { CookieSetter, InSiteCookieMiddleware } from "insite-cookie/server";
import { SubscriptionHandler } from "insite-subscriptions-server/ws";
import { InSiteWebSocketServer } from "insite-ws/server";
import { IncomingTransport, OutgoingTransport } from "insite-ws-transfers/node";
import type { AbilitiesSchema } from "insite-common";
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
import { Users } from "insite-users-server";
import { UsersServer, type WSSCWithUser } from "insite-users-server-ws";
import type { InSiteWebSocketServerWithActualProps, InSiteWithActualProps, Options } from "./types";


export class InSite<AS extends AbilitiesSchema, O extends Options<AS>> {
	constructor(options: O) {
		this.initPromise = this.init!(options);
		
	}
	
	mongoClient!: MongoClient;
	db!: InSiteDB;
	collections!: InSiteCollections;
	wss!: InSiteWebSocketServerWithActualProps<AS, O>;
	incomingTransport!: IncomingTransport;
	outgoingTransport!: OutgoingTransport;
	subscriptionHandler!: SubscriptionHandler<AS>;
	usersServer!: UsersServer<AS>;
	users!: Users<AS>;
	cookie!: CookieSetter<AS>;
	http!: InSiteHTTPServer;
	
	private init? = async (options: O) => {
		
		const {
			db: dbOptions,
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
		
		if (wssWithOtherOptions) {
			const {
				subscriptions,
				incomingTransport: incomingTransportOptions,
				outgoingTransport,
				...wssOptions
			} = wssWithOtherOptions;
			
			this.wss = new InSiteWebSocketServer<WSSCWithUser<AS>>(wssOptions) as InSiteWebSocketServerWithActualProps<AS, O>;
			
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
				template: templateMiddlewareOptions = undefined, // eslint-disable-line unicorn/no-useless-undefined
				middlewares = undefined, // eslint-disable-line unicorn/no-useless-undefined
				...httpOptions
			} = typeof httpWithMiddlewareOptions == "object" ? httpWithMiddlewareOptions : {};
			
			this.http = new InSiteHTTPServer(httpOptions, [
				staticMiddlewareOptions !== null && new InSiteStaticMiddleware(staticMiddlewareOptions ?? {}),
				cookieWithMiddlewareOptions !== null && new InSiteCookieMiddleware(cookieWithMiddlewareOptions?.middleware ?? {}),
				templateMiddlewareOptions !== null && new InSiteTemplateMiddleware(templateMiddlewareOptions ?? {}),
				...middlewares ?? []
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
		
		delete this.init;
		
		return this;
	};
	
	private initPromise;
	
	whenReady() {
		return this.initPromise;
	}
	
	
	static init<IO extends Options<any>>(options: IO) { // eslint-disable-line @typescript-eslint/no-explicit-any
		type IAS = IO extends Options<infer EIAS> ? EIAS : never;
		
		return (new InSite(options)).whenReady() as Promise<InSiteWithActualProps<InSite<IAS, IO>, IO>>;
	}
	
}
