import Link from "next/link";
import { blogPosts } from "@/lib/blogData";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import Header from "../components/Header";
import { createClient } from "@/utils/supabase/server";

export default async function BlogIndex() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header user={user} />
      <main>
        <div className="hero" style={{ minHeight: "40vh" }}>
          <div className="hero-content">
            <h1>Náš Blog</h1>
            <p>Tipy, triky a novinky zo sveta krásy a zdravia.</p>
          </div>
        </div>

        <section className="section">
          <h2 className="section-title">Najnovšie články</h2>
          <p className="section-sub">Inšpirujte sa našimi článkami</p>

          <div className="card-grid">
            {blogPosts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.id} className="rec-card">
                <div className="rec-image">
                  <img src={post.image} alt={post.title} />
                </div>
                <div className="rec-body">
                  <div className="rec-meta">
                    {format(new Date(post.date), "d. MMMM yyyy", { locale: sk })}
                  </div>
                  <h3 className="rec-name" style={{ fontSize: "20px", marginTop: "8px" }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.5", marginTop: "8px" }}>
                    {post.excerpt}
                  </p>
                  <div className="rec-tags" style={{ marginTop: "12px" }}>
                    {post.tags.map((tag) => (
                      <span key={tag} className="rec-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
