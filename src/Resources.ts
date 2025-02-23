export type BenutzerResource = {
    id?: string;
    name: string;
    email: string;
    password?: string;
    active?: boolean;
}

export type PocketResource = {
    id?: string;
    name: string;
    benutzer: string;
    notiz?: string;
    betrag: number;
}

export type SparzielResource = {
    id?: string;
    name: string;
    benutzer: string;
    notiz?: string;
    betrag: number;
    zielbetrag: number;
    faelligkeitsdatum?: string;
}

export type BuchungskategorieResource = {
    id?: string;
    name: string;
    benutzer: string;
    ausgabenlimit?: number | null;
}

export type BuchungResource = {
    id?: string;
    name: string;
    pocket: string;
    kategorie: string;
    datum: string;
    betrag: number;
    typ: string;
    intervall?: string;
    zielPocket?: string;
    notiz?: string;
    fromWiederkehrend?: boolean;
    zukunft?: boolean;
}

export type LoginResource = {
    id: string;
    expiresIn: number;
}

export type NotificationResource = {
	id?: string;
	benutzer: string;
	message: string;
	read: boolean;
};

