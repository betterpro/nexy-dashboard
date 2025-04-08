"use client";
import React from "react";
import { collection, addDoc } from "firebase/firestore";
import { DB, storage } from "../../firebase";
import { useForm } from "react-hook-form";

const FAQForm = () => {
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      await addDoc(collection(DB, "faqs"), data);
      alert("FAQ added successfully!");
      reset();
    } catch (error) {
      console.error("Error adding FAQ: ", error);
      alert("Failed to add FAQ");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Question:</label>
        <input {...register("question", { required: true })} />
      </div>
      <div>
        <label>Answer:</label>
        <textarea {...register("answer", { required: true })} />
      </div>
      <div>
        <label>Type:</label>
        <select {...register("type", { required: true })}>
          <option value="users">Users</option>
          <option value="businesses">Businesses</option>
          <option value="events">Events</option>
        </select>
      </div>
      <button type="submit">Submit</button>
    </form>
  );
};

export default FAQForm;
