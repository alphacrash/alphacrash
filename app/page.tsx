import { BlogPosts } from 'app/components/posts'

export default function Page() {
  return (
    <section>
      <h1 className="mb-2 text-2xl font-semibold tracking-tighter">
        alphacrash
      </h1>
      <p className="mb-8">
        {`Software Engineer. Full-Stack Developer (Spring and React).`}
      </p>
      <div className="my-8">
        <BlogPosts />
      </div>
    </section>
  )
}
