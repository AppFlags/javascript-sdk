import { v4 as uuidv4 } from 'uuid';

export interface AppFlagsUser {
    key: string;
}

const ANON_ID_KEY = "appflags-anonymous-id"

const getAnonymousUser = (): AppFlagsUser => {
    let anonId = localStorage.getItem(ANON_ID_KEY)
    if (!anonId) {
        anonId = "anon_" + uuidv4()
        localStorage.setItem(ANON_ID_KEY, anonId)
    }
    return {
        key: anonId
    }
}

export const AnonymousUser: AppFlagsUser = getAnonymousUser()