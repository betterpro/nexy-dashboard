"use client";
import { useForm } from "react-hook-form";
import { DB, storage } from "../../firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/context/AuthContext";
import { ROLES } from "@/components/context/roles";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Icon } from "@iconify/react";

const BlogForm = () => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role !== ROLES.SUPER_ADMIN) {
      router.push("/");
      toast.error("Access denied. Only Super Admin can create blog posts.");
    }
  }, [user, router]);

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt to generate content");
      return;
    }

    setGenerating(true);
    const toastId = toast.loading("Generating content...");

    try {
      const response = await fetch("/api/generate-blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const data = await response.json();

      // Fill the form with generated content
      setValue("title", data.title);
      setValue("description", data.description);
      setValue("content", data.content);
      setValue("category", data.category);
      setValue("author", "Nexy");
      setValue("aosDelay", "100");

      toast.update(toastId, {
        render: "Content generated successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error generating content: ", error);
      toast.update(toastId, {
        render: "Error generating content. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setGenerating(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    const toastId = toast.loading("Creating blog post...");

    try {
      // Create slug from title
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "_");

      // Handle image upload
      const imageRef = ref(storage, `blog/${data.image[0].name}`);
      await uploadBytes(imageRef, data.image[0]);
      const imageUrl = await getDownloadURL(imageRef);

      // Add data to Firestore
      await addDoc(collection(DB, "blogs"), {
        aosDelay: data.aosDelay,
        author: data.author,
        category: data.category,
        content: data.content,
        date: new Date(data.date),
        description: data.description,
        image: imageUrl,
        slug: slug,
        title: data.title,
        createdAt: new Date(),
        createdBy: user?.uid,
      });

      reset();
      setPrompt("");
      toast.update(toastId, {
        render: "Blog post created successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error adding blog post: ", error);
      toast.update(toastId, {
        render: "Error creating blog post. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== ROLES.SUPER_ADMIN) {
    return null;
  }

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white">
          Create New Blog Post
        </h3>
      </div>

      {/* AI Content Generation Section */}
      <div className="p-6.5 border-b border-stroke dark:border-strokedark">
        <div className="mb-4">
          <label className="mb-2.5 block text-black dark:text-white">
            Generate Content with AI
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter a prompt to generate blog content..."
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              type="button"
              onClick={generateContent}
              disabled={generating}
              className="flex items-center gap-2 rounded bg-primary px-4 py-3 font-medium text-gray hover:bg-opacity-90 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Icon icon="eos-icons:loading" className="text-xl" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Icon icon="mdi:robot" className="text-xl" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6.5">
        <div className="mb-4.5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2.5 block text-black dark:text-white">
              Title <span className="text-meta-1">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter blog title"
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-meta-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white">
              Author <span className="text-meta-1">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter author name"
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              {...register("author", { required: "Author is required" })}
              defaultValue="Nexy"
            />
            {errors.author && (
              <p className="mt-1 text-sm text-meta-1">
                {errors.author.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white">
              Category <span className="text-meta-1">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter category"
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              {...register("category", { required: "Category is required" })}
              defaultValue="events"
            />
            {errors.category && (
              <p className="mt-1 text-sm text-meta-1">
                {errors.category.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white">
              Date <span className="text-meta-1">*</span>
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              {...register("date", { required: "Date is required" })}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-meta-1">{errors.date.message}</p>
            )}
          </div>

          <div className="col-span-2">
            <label className="mb-2.5 block text-black dark:text-white">
              Description <span className="text-meta-1">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Enter blog description"
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              {...register("description", {
                required: "Description is required",
              })}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-meta-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="col-span-2">
            <label className="mb-2.5 block text-black dark:text-white">
              Content <span className="text-meta-1">*</span>
            </label>
            <textarea
              rows={6}
              placeholder="Enter blog content"
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              {...register("content", { required: "Content is required" })}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-meta-1">
                {errors.content.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white">
              AOS Delay <span className="text-meta-1">*</span>
            </label>
            <input
              type="number"
              placeholder="Enter AOS delay"
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              {...register("aosDelay", { required: "AOS delay is required" })}
              defaultValue="100"
            />
            {errors.aosDelay && (
              <p className="mt-1 text-sm text-meta-1">
                {errors.aosDelay.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white">
              Featured Image <span className="text-meta-1">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent font-medium outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-stroke file:bg-whiter file:py-3 file:px-5 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
              {...register("image", { required: "Image is required" })}
            />
            {errors.image && (
              <p className="mt-1 text-sm text-meta-1">{errors.image.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Icon icon="eos-icons:loading" className="text-xl" />
              <span>Saving...</span>
            </div>
          ) : (
            "Create Blog Post"
          )}
        </button>
      </form>
    </div>
  );
};

export default BlogForm;
