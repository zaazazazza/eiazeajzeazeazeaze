export declare const adminEmailsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "sicariostore_admin_emails";
    schema: undefined;
    columns: {
        email: import("drizzle-orm/pg-core").PgColumn<{
            name: "email";
            tableName: "sicariostore_admin_emails";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "sicariostore_admin_emails";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export type AdminEmail = typeof adminEmailsTable.$inferSelect;
//# sourceMappingURL=admin-emails.d.ts.map