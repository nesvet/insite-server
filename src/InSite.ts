import { CookieSetter, InSiteCookieMiddleware } from "insite-cookie/server";
import { SubscriptionHandler, WithUser } from "insite-subscriptions-server/ws";
import { InSiteWebSocketServer, InSiteWebSocketServerClient } from "insite-ws/server";
import { IncomingTransport } from "insite-ws-transfers/node";
import {
	connect,
	type InSiteCollections,
	type InSiteDB,
	MongoClient
} from "insite-db";
import {
	InSiteHTTPServer,
	InSiteServerMiddleware,
	InSiteStaticMiddleware,
	InSiteTemplateMiddleware
} from "insite-http";
import { type AbilitiesSchema, Users } from "insite-users-server";
import { UsersServer } from "insite-users-server-ws";
import { Optional, Options } from "./types";


export class InSite<AS extends AbilitiesSchema> {
	constructor(options: Options<AS>) {
		this.#initPromise = this.init!(options);
		
	}
	
	mongoClient!: MongoClient;
	db!: InSiteDB;
	collections!: InSiteCollections;
	wss!: InSiteWebSocketServer;
	incomingTransport!: IncomingTransport;
	subscriptionHandler!: SubscriptionHandler<AS>;
	usersServer!: UsersServer<AS>;
	users!: Users<AS>;
	cookie!: CookieSetter<AS>;
	http!: InSiteHTTPServer;
	
	private init? = async (options: Options<AS>) => {
		
		const {
			db: dbOptions,
			wss: wssOptions,
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
		
		if (wssOptions) {
			this.wss = new InSiteWebSocketServer(wssOptions);
			
			if (process.env.NODE_ENV === "development")
				this.wss.on("client-connect", (wssc: WithUser<InSiteWebSocketServerClient>) => console.info(`🔌 WebSocket connected with ${wssc.session?.user.email}`));
			
			this.wss.on("error", (error: Error) => console.error("🔌❗️ WebSocket Server:", error));
			this.wss.on("close", () => console.error("🔌❗️ WebSocket Server closed"));
			
			this.incomingTransport = new IncomingTransport(this.wss);
			
			this.subscriptionHandler = new SubscriptionHandler(this.wss);
		}
		
		if (usersWithServerOptions && this.collections) {
			const { server: usersServerOptions, ...usersOptions } = usersWithServerOptions;
			
			if (usersServerOptions && this.wss) {
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
	
	#initPromise;
	
	whenReady() {
		return this.#initPromise;
	}
	
	
	static init<
		IAS extends AbilitiesSchema,
		IO extends Options<IAS>
	>(options: IO) {
		return (new InSite(options)).whenReady() as Promise<Optional<InSite<IAS>, IO, IAS>>;
	}
	
}
