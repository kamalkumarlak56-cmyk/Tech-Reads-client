import { useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { sampleProducts } from "../data/sampleProducts.js";

const reviews = [
    { bookId: "sample-ai-book", name: "Aarav Mehta", rating: 5, quote: "The AI book collection is focused and practical. I found material I could use immediately." },
    { bookId: "sample-ai-book", name: "Meera Shah", rating: 4, quote: "The evaluation chapters made difficult AI concepts easy to apply in my own projects." },
    { bookId: "sample-ai-book", name: "Vikram Rao", rating: 5, quote: "The responsible AI guidance is thoughtful and easy to follow." },
    { bookId: "sample-ai-book", name: "Nisha Verma", rating: 4, quote: "A strong introduction with examples that connect theory to real products." },
    { bookId: "sample-ai-book", name: "Arjun Kapoor", rating: 5, quote: "Clear explanations and useful checklists for building reliable AI systems." },
    { bookId: "sample-ai-book", name: "Pooja Iyer", rating: 5, quote: "One of the most practical AI books I have read this year." },
    { bookId: "sample-cyber-book", name: "Imran Khan", rating: 5, quote: "Clean explanations and useful security examples. Perfect for students and working developers." },
    { bookId: "sample-cyber-book", name: "Rohan Singh", rating: 5, quote: "The threat-modeling exercises are practical and valuable for anyone working in security." },
    { bookId: "sample-cyber-book", name: "Ananya Das", rating: 5, quote: "The incident response chapters helped our team improve its security process." },
    { bookId: "sample-cyber-book", name: "Rahul Joshi", rating: 4, quote: "Detailed without becoming difficult to read. A valuable security reference." },
    { bookId: "sample-cyber-book", name: "Sana Ali", rating: 5, quote: "The examples make threat modeling much easier to understand." },
    { bookId: "sample-cyber-book", name: "Kabir Mehta", rating: 5, quote: "Excellent practical guidance for building safer applications." },
    { bookId: "sample-react-book", name: "Sneha Rao", rating: 5, quote: "The React patterns are clear and practical. I used the examples in my next project." },
    { bookId: "sample-react-book", name: "Kavya Nair", rating: 4, quote: "A useful reference for authentication, state management, and production deployment." },
    { bookId: "sample-react-book", name: "Dev Sharma", rating: 5, quote: "The architecture examples helped me organize a growing React codebase." },
    { bookId: "sample-react-book", name: "Isha Kapoor", rating: 4, quote: "A concise and helpful guide for moving from tutorials to production work." },
    { bookId: "sample-react-book", name: "Manav Gupta", rating: 5, quote: "The API integration patterns saved me a lot of implementation time." },
    { bookId: "sample-react-book", name: "Tara Sen", rating: 5, quote: "Great reference material for everyday full-stack development." }
];

function Rating({ value }) {
    return (
        <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-700">
            <Star size={16} fill="currentColor" /> {value.toFixed(1)}
        </span>
    );
}

function BookReviewCard({ book }) {
    const [showAllReviews, setShowAllReviews] = useState(false);
    const visibleReviews = showAllReviews ? book.bookReviews : book.bookReviews.slice(0, 5);

    return (
        <section className="overflow-hidden rounded-lg border border-line bg-white shadow-soft" key={book._id}>
            <div className="flex flex-row items-start gap-5 border-b border-line p-5 max-[600px]:flex-col md:p-6">
                <Link to={`/products/${book._id}`} className="block h-[200px] w-[300px] max-w-full flex-none">
                    <img className="h-full w-full rounded-lg object-cover shadow-sm" style={{ width: "300px", height: "200px", maxWidth: "100%" }} src={book.image} alt={book.title} />
                </Link>
                <div className="min-w-0 flex-1 max-[600px]:w-full">
                    <span className="mb-2 inline-block text-xs font-extrabold uppercase text-teal-600">Book</span>
                    <Link to={`/products/${book._id}`} className="block text-2xl font-black text-ink hover:text-blue-600 md:text-3xl">{book.title}</Link>
                    <p className="mt-2 text-muted">By {book.author}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                        <Rating value={book.rating} />
                        <span className="text-sm text-muted">{book.bookReviews.length} review{book.bookReviews.length === 1 ? "" : "s"}</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
                {visibleReviews.map((review) => (
                    <article className="rounded-lg border border-line bg-slate-50 p-5" key={`${book._id}-${review.name}`}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <strong className="text-ink">{review.name}</strong>
                            <Rating value={review.rating} />
                        </div>
                        <p className="leading-7 text-slate-600">{review.quote}</p>
                    </article>
                ))}
            </div>
            {book.bookReviews.length > 5 && (
                <div className="flex justify-center px-6 pb-6">
                    <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-600 px-5 py-2 font-bold text-blue-600 transition hover:bg-blue-50"
                        onClick={() => setShowAllReviews(!showAllReviews)}
                    >
                        {showAllReviews ? "Show less" : "See more"}
                    </button>
                </div>
            )}
        </section>
    );
}

export default function Reviews() {
    const books = sampleProducts
        .filter((product) => product.category === "Book")
        .map((book) => ({
            ...book,
            bookReviews: reviews.filter((review) => review.bookId === book._id)
        }))
        .filter((book) => book.bookReviews.length > 0)
        .sort((a, b) => b.rating - a.rating);
    const topRatedBooks = books.slice(0, Math.max(1, Math.ceil(books.length / 2)));
    const lowerRatedBooks = books.slice(topRatedBooks.length);

    return (
        <section className="py-16">
            <div className="mx-auto w-[min(1180px,calc(100%_-_40px))]">
                <div className="mb-10">
                    <span className="mb-3 inline-block text-xs font-extrabold uppercase text-teal-600">Reader favorites</span>
                    <h1 className="text-4xl font-black text-ink md:text-5xl">Book-wise reviews</h1>
                    <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">See each book's cover, rating, and every reader review collected for it.</p>
                </div>

                <div className="mb-5">
                    <span className="mb-2 inline-block text-xs font-extrabold uppercase text-teal-600">Highest rated</span>
                    <h2 className="text-3xl font-black text-ink md:text-4xl">Top rated books</h2>
                </div>
                <div className="grid gap-10">
                    {topRatedBooks.map((book) => <BookReviewCard key={book._id} book={book} />)}
                </div>

                {lowerRatedBooks.length > 0 && (
                    <>
                        <div className="mb-5 mt-16">
                            <span className="mb-2 inline-block text-xs font-extrabold uppercase text-teal-600">More reader reviews</span>
                            <h2 className="text-3xl font-black text-ink md:text-4xl">More books and ratings</h2>
                        </div>
                        <div className="grid gap-10">
                            {lowerRatedBooks.map((book) => <BookReviewCard key={book._id} book={book} />)}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
