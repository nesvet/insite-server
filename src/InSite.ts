import { CookieSetter, InSiteCookieMiddleware } from "insite-cookie/server";
import { SubscriptionHandler } from "insite-subscriptions-server/ws";
import { InSiteWebSocketServer } from "insite-ws/server";
import { IncomingTransport, OutgoingTransport } from "insite-ws-transfers/node";
import { StatefulPromise } from "@nesvet/n";
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


/* eslint-disable @typescript-eslint/no-explicit-any */


export class InSite<AS extends AbilitiesSchema, O extends Options<AS>> {
	constructor(options?: O) {
		if (options)
			this.init!(options);
		
	}
	
	mongoClient!: MongoClient;
	db!: InSiteDB;
	collections!: InSiteCollections;
	wss!: InSiteWebSocketServerWithActualProps<AS, O>;
	incomingTransport!: IncomingTransport<WSSCWithUser<AS>>;
	outgoingTransport!: OutgoingTransport<WSSCWithUser<AS>>;
	subscriptionHandler!: SubscriptionHandler<AS>;
	usersServer!: UsersServer<AS>;
	users!: Users<AS>;
	cookie!: CookieSetter<AS>;
	http!: InSiteHTTPServer;
	
	[key: number | string | symbol]: unknown;
	
			if (this.collections && configSchema)
				this.config = await initConfig(this.collections, configSchema) as InSiteConfig<O>;
		
	};
	
	#initPromise = new StatefulPromise<this>();
	
	whenReady() {
		return this.#initPromise;
	}
	
	
	static init<IO extends Options<any>, IAS extends AbilitiesSchema = IO extends Options<infer A> ? A : never>(options: IO, asPromise?: true): Promise<InSiteWithActualProps<InSite<IAS, IO>, IO>>;
	static init<IO extends Options<any>, IAS extends AbilitiesSchema = IO extends Options<infer A> ? A : never>(options: IO, asPromise?: false): InSiteWithActualProps<InSite<IAS, IO>, IO>;
	static init<IO extends Options<any>, IAS extends AbilitiesSchema = IO extends Options<infer A> ? A : never>(options: IO, asPromise = true) {
		const inSite = new InSite<IAS, IO>(options);
		
		return asPromise ?
			inSite.whenReady() as Promise<InSiteWithActualProps<InSite<IAS, IO>, IO>> :
			inSite as InSiteWithActualProps<InSite<IAS, IO>, IO>;
	}
	
}
