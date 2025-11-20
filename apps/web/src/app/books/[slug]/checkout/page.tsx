"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface Book {
  _id: string;
  title: string;
  description: string;
  priceCents: number;
  coverUrl?: string;
}

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    async function setup() {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          window.location.href = "/auth/signin";
          return;
        }

        const bookRes = await axios.get(`${API_URL}/api/books/${slug}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setBook(bookRes.data);

        const orderRes = await axios.post(
          `${API_URL}/api/orders`,
          { bookId: bookRes.data._id },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        setOrderId(orderRes.data.orderId);
        setClientSecret(orderRes.data.clientSecret);
      } catch (err: any) {
        setError(err.response?.data?.message || "Setup failed");
      } finally {
        setLoading(false);
      }
    }

    setup();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      {book && (
        <>
          <div className="mb-6 p-4 bg-gray-100 rounded">
            <h2 className="font-bold text-lg">{book.title}</h2>
            <p className="text-sm text-gray-600 mt-2">{book.description}</p>
            <p className="text-lg font-bold mt-2">${(book.priceCents / 100).toFixed(2)}</p>
          </div>

          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm clientSecret={clientSecret} orderId={orderId} />
            </Elements>
          )}
        </>
      )}
    </div>
  );
}

interface CheckoutFormProps {
  clientSecret: string;
  orderId: string;
}

function CheckoutForm({ clientSecret, orderId }: CheckoutFormProps) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError("Card element not found");
        return;
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        setError(result.error.message || "Payment failed");
      } else if (result.paymentIntent?.status === "succeeded") {
        router.push("/purchases");
      }
    } catch (err: any) {
      setError(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Card Details</label>
        <div className="p-3 border rounded">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
                invalid: {
                  color: "#9e2146",
                },
              },
            }}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}
