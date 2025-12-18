import { blogPosts } from "@/lib/blogData";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import { createClient } from "@/utils/supabase/server";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!post) {
    notFound();
  }

  return (
    <>
      <Header user={user} />
      <main>
        <div className="breadcrumbs-container" style={{ paddingTop: "20px" }}>
          <div className="breadcrumbs">
            <Link href="/">Domov</Link> / <Link href="/blog">Blog</Link> / <span>{post.title}</span>
          </div>
        </div>

        <article className="section" style={{ maxWidth: "800px", paddingTop: "0" }}>
          <h1 style={{ 
            fontFamily: "var(--font-heading)", 
            fontSize: "42px", 
            marginBottom: "16px",
            lineHeight: "1.2"
          }}>
            {post.title}
          </h1>
          
          <div style={{ 
            display: "flex", 
            gap: "20px", 
            color: "var(--text-muted)", 
            marginBottom: "30px",
            fontSize: "14px",
            alignItems: "center"
          }}>
            <span>{format(new Date(post.date), "d. MMMM yyyy", { locale: sk })}</span>
            <span>•</span>
            <span>{post.author}</span>
          </div>

          <div style={{ marginBottom: "40px" }}>
            <img 
              src={post.image} 
              alt={post.title} 
              style={{ 
                width: "100%", 
                height: "auto", 
                borderRadius: "var(--radius)",
                boxShadow: "var(--shadow)"
              }} 
            />
          </div>

          <div 
            className="blog-content"
            style={{ 
              fontSize: "18px", 
              lineHeight: "1.8", 
              color: "#333" 
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid var(--border-color)" }}>
             <h4 style={{ marginBottom: "12px" }}>Tags:</h4>
             <div className="rec-tags">
                {post.tags.map((tag) => (
                  <span key={tag} className="rec-tag">
                    {tag}
                  </span>
                ))}
              </div>
          </div>

          <div style={{ marginTop: "60px", textAlign: "center" }}>
            <Link href="/blog" className="btn-secondary" style={{ display: "inline-block" }}>
              ← Späť na blog
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
