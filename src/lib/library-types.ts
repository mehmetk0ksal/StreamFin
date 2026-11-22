export type ReviewType = 'movie' | 'tv' | 'season' | 'episode';
export type WatchStatus = 'plan_to_watch' | 'watching' | 'completed' | 'dropped';

export const STATUS_LABELS: Record<WatchStatus, string> = {
    plan_to_watch: 'İzleyeceğim',
    watching: 'İzliyorum',
    completed: 'İzledim',
    dropped: 'Yarım bıraktım',
};

export const REVIEW_TEXT_MAX_LENGTH = 5000;

export interface Review {
    review_id: number;
    user_id: number;
    username: string;
    media_type: ReviewType;
    tmdb_id: number;
    season_number: number | null;
    episode_number: number | null;
    media_title: string;
    rating: number;
    review_text: string | null;
    is_hidden: boolean;
    created_at: string;
    updated_at: string;
}

export interface ReviewList {
    reviews: Review[];
    average_rating: number | null;
    review_count: number;
    current_user_id: number | null;
}

export interface WatchlistEntry {
    watchlist_id: number;
    user_id: number;
    media_type: 'movie' | 'tv';
    tmdb_id: number;
    media_title: string;
    poster_path: string | null;
    status: WatchStatus;
    updated_at: string;
}
