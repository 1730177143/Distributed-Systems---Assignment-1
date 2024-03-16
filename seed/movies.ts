import {Movie, MovieCast, MovieReview} from '../shared/types'

export const movies: Movie[] = [
    {
        adult: false,
        backdrop_path: '/zIYROrkHJPYB3VTiW1L9QVgaQO.jpg',
        genre_ids: [28, 35],
        id: 897087,
        original_language: 'en',
        original_title: 'Freelance',
        overview: 'An ex-special forces operative takes a job to provide security for a journalist as she interviews a dictator, but a military coup breaks out in the middle of the interview, they are forced to escape into the jungle where they must survive.',
        popularity: 501.319,
        poster_path: '/7Bd4EUOqQDKZXA6Od5gkfzRNb0.jpg',
        release_date: '2023-10-05',
        title: 'Freelance',
        video: false,
        vote_average: 6.5,
        vote_count: 390
    },
    {
        adult: false,
        backdrop_path: '/t5zCBSB5xMDKcDqe91qahCOUYVV.jpg',
        genre_ids: [27, 9648],
        id: 507089,
        original_language: 'en',
        original_title: "Five Nights at Freddy's",
        overview: "Recently fired and desperate for work, a troubled young man named Mike agrees to take a position as a night security guard at an abandoned theme restaurant: Freddy Fazbear's Pizzeria. But he soon discovers that nothing at Freddy's is what it seems.",
        popularity: 496.682,
        poster_path: '/7BpNtNfxuocYEVREzVMO75hso1l.jpg',
        release_date: '2023-10-25',
        title: "Five Nights at Freddy's",
        video: false,
        vote_average: 7.8,
        vote_count: 2993
    },
    {
        adult: false,
        backdrop_path: '/9jPoyxjiEYPylUIMI3Ntixf8z3M.jpg',
        genre_ids: [16, 12, 35, 10751],
        id: 520758,
        original_language: 'en',
        original_title: 'Chicken Run: Dawn of the Nugget',
        overview: "A band of fearless chickens flock together to save poultry-kind from an unsettling new threat: a nearby farm that's cooking up something suspicious.",
        popularity: 494.214,
        poster_path: '/exNtEY8QUuQh9e23wSQjkPxKIU3.jpg',
        release_date: '2023-12-08',
        title: 'Chicken Run: Dawn of the Nugget',
        video: false,
        vote_average: 7.4,
        vote_count: 325
    }
]
export const movieCasts: MovieCast[] = [
    {
        movieId: 1234,
        actorName: "Joe Bloggs",
        roleName: "Male Character 1",
        roleDescription: "description of character 1",
    },
    {
        movieId: 1234,
        actorName: "Alice Broggs",
        roleName: "Female Character 1",
        roleDescription: "description of character 2",
    },
    {
        movieId: 1234,
        actorName: "Joe Cloggs",
        roleName: "Male Character 2",
        roleDescription: "description of character 3",
    },
    {
        movieId: 2345,
        actorName: "Joe Bloggs",
        roleName: "Male Character 1",
        roleDescription: "description of character 3",
    },
];
export const movieReviews: MovieReview[] = [
    {
        MovieId: 1234,
        ReviewerName: 'Bloggs',
        ReviewDate: '2023-03-01',
        Content: 'Review 1',
        Rating: 1,
    },
    {
        MovieId: 2234,
        ReviewerName: 'Joe',
        ReviewDate: '2024-03-02',
        Content: 'Review 2',
        Rating: 3,
    },
    {
        MovieId: 1234,
        ReviewerName: 'Cloggs',
        ReviewDate: '2024-03-03',
        Content: 'Review 3',
        Rating: 5,
    },
    {
        MovieId: 6234,
        ReviewerName: 'Bloggs',
        ReviewDate: '2024-03-09',
        Content: 'Review 4',
        Rating: 4,
    }
];
