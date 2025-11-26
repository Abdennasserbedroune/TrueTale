import { getSupabaseClient } from "../config/supabaseClient";

export interface BookFile {
  id: string;
  book_id: string;
  file_type: "pdf" | "epub" | "mobi" | "sample";
  url: string;
  size: number;
  uploaded_at: string;
}

export interface Book {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  description: string;
  cover_url: string | null;
  price_cents: number;
  currency: string;
  is_draft: boolean;
  status: string;
  visibility: string;
  tags: string[];
  category: string | null;
  language: string;
  pages: number | null;
  average_rating: number;
  review_count: number;
  views: number;
  sales: number;
  published_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  files?: BookFile[];
}

export interface BookCreateData {
  author_id: string;
  title: string;
  slug: string;
  description?: string;
  cover_url?: string;
  price_cents?: number;
  currency?: string;
  is_draft?: boolean;
  status?: string;
  visibility?: string;
  tags?: string[];
  category?: string;
  language?: string;
  pages?: number;
  metadata?: Record<string, any>;
}

export interface BookUpdateData {
  title?: string;
  slug?: string;
  description?: string;
  cover_url?: string;
  price_cents?: number;
  currency?: string;
  is_draft?: boolean;
  status?: string;
  visibility?: string;
  tags?: string[];
  category?: string;
  language?: string;
  pages?: number;
  metadata?: Record<string, any>;
  views?: number;
  sales?: number;
}

export class BookRepository {
  private supabase = getSupabaseClient();

  async findById(id: string, includeFiles = false): Promise<Book | null> {
    let query = this.supabase.from("books").select("*").eq("id", id);

    const { data, error } = await query.single();

    if (error || !data) {
      return null;
    }

    const book = data as Book;

    if (includeFiles) {
      const { data: files } = await this.supabase.from("book_files").select("*").eq("book_id", id);
      book.files = (files || []) as BookFile[];
    }

    return book;
  }

  async findBySlug(slug: string, includeFiles = false): Promise<Book | null> {
    const { data, error } = await this.supabase.from("books").select("*").eq("slug", slug).single();

    if (error || !data) {
      return null;
    }

    const book = data as Book;

    if (includeFiles) {
      const { data: files } = await this.supabase.from("book_files").select("*").eq("book_id", book.id);
      book.files = (files || []) as BookFile[];
    }

    return book;
  }

  async findByAuthor(
    authorId: string,
    options: { includeDrafts?: boolean; limit?: number; offset?: number } = {}
  ): Promise<{ books: Book[]; total: number }> {
    let query = this.supabase.from("books").select("*", { count: "exact" }).eq("author_id", authorId);

    if (!options.includeDrafts) {
      query = query.eq("is_draft", false);
    }

    query = query.order("created_at", { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      books: (data || []) as Book[],
      total: count || 0,
    };
  }

  async search(params: {
    query?: string;
    tags?: string[];
    authorId?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: "newest" | "popular" | "price_asc" | "price_desc" | "rating";
    limit?: number;
    offset?: number;
  }): Promise<{ books: Book[]; total: number }> {
    let query = this.supabase
      .from("books")
      .select("*", { count: "exact" })
      .eq("status", "published")
      .eq("visibility", "public");

    if (params.query) {
      query = query.textSearch("title", params.query);
    }

    if (params.tags && params.tags.length > 0) {
      query = query.contains("tags", params.tags);
    }

    if (params.authorId) {
      query = query.eq("author_id", params.authorId);
    }

    if (params.minPrice !== undefined) {
      query = query.gte("price_cents", params.minPrice);
    }

    if (params.maxPrice !== undefined) {
      query = query.lte("price_cents", params.maxPrice);
    }

    switch (params.sortBy) {
      case "newest":
        query = query.order("published_at", { ascending: false });
        break;
      case "popular":
        query = query.order("sales", { ascending: false });
        break;
      case "price_asc":
        query = query.order("price_cents", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price_cents", { ascending: false });
        break;
      case "rating":
        query = query.order("average_rating", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      books: (data || []) as Book[],
      total: count || 0,
    };
  }

  async create(bookData: BookCreateData): Promise<Book> {
    const { data, error } = await this.supabase
      .from("books")
      .insert({
        author_id: bookData.author_id,
        title: bookData.title,
        slug: bookData.slug,
        description: bookData.description || "",
        cover_url: bookData.cover_url || null,
        price_cents: bookData.price_cents || 0,
        currency: bookData.currency || "USD",
        is_draft: bookData.is_draft !== undefined ? bookData.is_draft : true,
        status: bookData.status || "draft",
        visibility: bookData.visibility || "private",
        tags: bookData.tags || [],
        category: bookData.category || null,
        language: bookData.language || "English",
        pages: bookData.pages || null,
        metadata: bookData.metadata || {},
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create book");
    }

    return data as Book;
  }

  async update(id: string, updateData: BookUpdateData): Promise<Book> {
    const { data, error } = await this.supabase.from("books").update(updateData).eq("id", id).select().single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to update book");
    }

    return data as Book;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("books").delete().eq("id", id);

    if (error) {
      throw new Error(error.message || "Failed to delete book");
    }
  }

  async incrementViews(id: string): Promise<void> {
    await this.supabase.rpc("increment_book_views", { book_id: id }).then(() => {});

    const book = await this.findById(id);
    if (book) {
      await this.update(id, { views: book.views + 1 });
    }
  }

  async incrementSales(id: string): Promise<void> {
    const book = await this.findById(id);
    if (book) {
      await this.update(id, { sales: book.sales + 1 });
    }
  }

  async addFile(fileData: Omit<BookFile, "id" | "uploaded_at">): Promise<BookFile> {
    const { data, error } = await this.supabase
      .from("book_files")
      .insert({
        book_id: fileData.book_id,
        file_type: fileData.file_type,
        url: fileData.url,
        size: fileData.size,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to add file");
    }

    return data as BookFile;
  }

  async getFiles(bookId: string): Promise<BookFile[]> {
    const { data, error } = await this.supabase.from("book_files").select("*").eq("book_id", bookId);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []) as BookFile[];
  }

  async deleteFile(fileId: string): Promise<void> {
    const { error } = await this.supabase.from("book_files").delete().eq("id", fileId);

    if (error) {
      throw new Error(error.message || "Failed to delete file");
    }
  }
}
