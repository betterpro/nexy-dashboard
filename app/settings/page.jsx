"use client";
import { useForm } from "react-hook-form";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { DB, storage } from "@/firebase";
import Image from "next/image";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useAuth } from "@/components/context/AuthContext";
import { Icon } from "@iconify/react/dist/iconify.js";
import { ROLES } from "@/components/context/roles";

const Settings = () => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  const { user, userRole } = useAuth();

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      const userRef = doc(DB, "users", user.uid);
      const updateData = {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        email: data.email,
      };

      // Add role-specific fields
      if (userRole === ROLES.FRANCHISEE) {
        updateData.etransfer = data.etransfer;
        updateData.businessName = data.businessName;
        updateData.businessAddress = data.businessAddress;
        updateData.businessPhone = data.businessPhone;
      } else if (userRole === ROLES.PARTNER) {
        updateData.etransfer = data.etransfer;
        updateData.partnerName = data.partnerName;
        updateData.partnerAddress = data.partnerAddress;
        updateData.partnerPhone = data.partnerPhone;
        updateData.partnerShare = data.partnerShare;
      }

      await updateDoc(userRef, updateData);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile: ", error);
      toast.error("Failed to update profile.");
    }
  };

  // Handle image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const storageRef = ref(storage, `${userRole}-user/${user.uid}/profile-pic`);
    await uploadBytes(storageRef, file);

    const imageUrl = await getDownloadURL(storageRef);
    await setDoc(
      doc(DB, "users", user.uid),
      { partnerLogo: imageUrl },
      { merge: true }
    );

    toast.success("Image uploaded successfully!");
  };

  return (
    <>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Settings" />

        <div className="grid grid-cols-5 gap-8">
          <div className="col-span-5 xl:col-span-3">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Contact Information
                </h3>
              </div>
              <div className="p-7">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                      <label
                        className="mb-3 block text-sm font-medium text-black dark:text-white"
                        htmlFor="fullName"
                      >
                        Full Name
                      </label>
                      <div className="relative flex items-center mt-2">
                        <span className="absolute pl-3">
                          <Icon icon="iconamoon:profile-thin" width={20} />
                        </span>
                        <input
                          className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          type="text"
                          {...register("fullName", { required: true })}
                          defaultValue={user?.fullName}
                        />
                      </div>
                      {errors.fullName && <span>This field is required</span>}
                    </div>

                    <div className="w-full sm:w-1/2">
                      <label
                        className="mb-3 block text-sm font-medium text-black dark:text-white"
                        htmlFor="phoneNumber"
                      >
                        Phone Number
                      </label>
                      <div className="relative flex items-center mt-2">
                        <span className="absolute pl-3">
                          <Icon icon="ph:phone-thin" width={20} />
                        </span>
                        <input
                          className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          type="text"
                          {...register("phoneNumber", { required: true })}
                          defaultValue={user?.phoneNumber}
                        />
                      </div>
                      {errors.phoneNumber && (
                        <span>This field is required</span>
                      )}
                    </div>
                  </div>

                  <div className="mb-5.5">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="email"
                    >
                      Email Address
                    </label>
                    <div className="relative flex items-center mt-2">
                      <span className="absolute pl-3">
                        <Icon icon="mdi-light:email" width={20} />
                      </span>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="email"
                        {...register("email", { required: true })}
                        defaultValue={user?.email}
                      />
                    </div>
                    {errors.email && <span>This field is required</span>}
                  </div>

                  {/* Franchisee-specific fields */}
                  {userRole === ROLES.FRANCHISEE && (
                    <>
                      <div className="mb-5.5">
                        <label
                          className="mb-3 block text-sm font-medium text-black dark:text-white"
                          htmlFor="businessName"
                        >
                          Business Name
                        </label>
                        <div className="relative flex items-center mt-2">
                          <span className="absolute pl-3">
                            <Icon icon="mdi:store" width={20} />
                          </span>
                          <input
                            className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            {...register("businessName", { required: true })}
                            defaultValue={user?.businessName}
                          />
                        </div>
                        {errors.businessName && (
                          <span>This field is required</span>
                        )}
                      </div>

                      <div className="mb-5.5">
                        <label
                          className="mb-3 block text-sm font-medium text-black dark:text-white"
                          htmlFor="businessAddress"
                        >
                          Business Address
                        </label>
                        <div className="relative flex items-center mt-2">
                          <span className="absolute pl-3">
                            <Icon icon="mdi:map-marker" width={20} />
                          </span>
                          <input
                            className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            {...register("businessAddress", { required: true })}
                            defaultValue={user?.businessAddress}
                          />
                        </div>
                        {errors.businessAddress && (
                          <span>This field is required</span>
                        )}
                      </div>

                      <div className="mb-5.5">
                        <label
                          className="mb-3 block text-sm font-medium text-black dark:text-white"
                          htmlFor="businessPhone"
                        >
                          Business Phone
                        </label>
                        <div className="relative flex items-center mt-2">
                          <span className="absolute pl-3">
                            <Icon icon="mdi:phone" width={20} />
                          </span>
                          <input
                            className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            {...register("businessPhone", { required: true })}
                            defaultValue={user?.businessPhone}
                          />
                        </div>
                        {errors.businessPhone && (
                          <span>This field is required</span>
                        )}
                      </div>
                    </>
                  )}

                  {/* Partner-specific fields */}
                  {userRole === ROLES.PARTNER && (
                    <>
                      <div className="mb-5.5">
                        <label
                          className="mb-3 block text-sm font-medium text-black dark:text-white"
                          htmlFor="partnerName"
                        >
                          Partner Name
                        </label>
                        <div className="relative flex items-center mt-2">
                          <span className="absolute pl-3">
                            <Icon icon="mdi:account-group" width={20} />
                          </span>
                          <input
                            className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            {...register("partnerName", { required: true })}
                            defaultValue={user?.partnerName}
                          />
                        </div>
                        {errors.partnerName && (
                          <span>This field is required</span>
                        )}
                      </div>

                      <div className="mb-5.5">
                        <label
                          className="mb-3 block text-sm font-medium text-black dark:text-white"
                          htmlFor="partnerAddress"
                        >
                          Partner Address
                        </label>
                        <div className="relative flex items-center mt-2">
                          <span className="absolute pl-3">
                            <Icon icon="mdi:map-marker" width={20} />
                          </span>
                          <input
                            className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            {...register("partnerAddress", { required: true })}
                            defaultValue={user?.partnerAddress}
                          />
                        </div>
                        {errors.partnerAddress && (
                          <span>This field is required</span>
                        )}
                      </div>

                      <div className="mb-5.5">
                        <label
                          className="mb-3 block text-sm font-medium text-black dark:text-white"
                          htmlFor="partnerPhone"
                        >
                          Partner Phone
                        </label>
                        <div className="relative flex items-center mt-2">
                          <span className="absolute pl-3">
                            <Icon icon="mdi:phone" width={20} />
                          </span>
                          <input
                            className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            {...register("partnerPhone", { required: true })}
                            defaultValue={user?.partnerPhone}
                          />
                        </div>
                        {errors.partnerPhone && (
                          <span>This field is required</span>
                        )}
                      </div>

                      <div className="mb-5.5">
                        <label
                          className="mb-3 block text-sm font-medium text-black dark:text-white"
                          htmlFor="partnerShare"
                        >
                          Partner Share (%)
                        </label>
                        <div className="relative flex items-center mt-2">
                          <span className="absolute pl-3">
                            <Icon icon="mdi:percent" width={20} />
                          </span>
                          <input
                            className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="number"
                            min="0"
                            max="100"
                            {...register("partnerShare", { required: true })}
                            defaultValue={user?.partnerShare}
                          />
                        </div>
                        {errors.partnerShare && (
                          <span>This field is required</span>
                        )}
                      </div>
                    </>
                  )}

                  {/* E-transfer field for both Franchisee and Partner */}
                  {(userRole === ROLES.FRANCHISEE ||
                    userRole === ROLES.PARTNER) && (
                    <div className="mb-5.5">
                      <label
                        className="mb-3 block text-sm font-medium text-black dark:text-white"
                        htmlFor="etransfer"
                      >
                        Email for E-transfer
                      </label>
                      <div className="relative flex items-center mt-2">
                        <span className="absolute pl-3">
                          <Icon icon="nimbus:money" width={20} />
                        </span>
                        <input
                          className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          type="text"
                          {...register("etransfer", { required: true })}
                          defaultValue={user?.etransfer}
                        />
                      </div>
                      {errors.etransfer && <span>This field is required</span>}
                    </div>
                  )}

                  {/* Referral Information Section */}
                  <div className="mb-8">
                    <h4 className="mb-4 text-lg font-medium text-black dark:text-white">
                      Referral Information
                    </h4>
                    <div>
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        Referral Code
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2">
                          <Icon
                            icon="material-symbols-light:person-add"
                            width={20}
                          />
                        </span>
                        <input
                          className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          type="text"
                          {...register("referal_code")}
                          defaultValue={user?.referal_code}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4.5">
                    <button
                      className="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                      type="submit"
                    >
                      Cancel
                    </button>
                    <button
                      className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-95"
                      type="submit"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="col-span-5 xl:col-span-2">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  {userRole === ROLES.FRANCHISEE
                    ? "Business Logo"
                    : "Partner Logo"}
                </h3>
              </div>
              <div className="p-7">
                <form>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full">
                      {user?.partnerLogo && (
                        <Image
                          className="rounded-lg"
                          src={user?.partnerLogo}
                          alt={
                            userRole === ROLES.FRANCHISEE
                              ? user?.businessName
                              : user?.partnerName
                          }
                          width={55}
                          height={55}
                        />
                      )}
                    </div>
                  </div>

                  <div
                    id="FileUpload"
                    className="relative mb-5.5 block w-full cursor-pointer appearance-none rounded border-2 border-dashed border-primary bg-gray py-4 px-4 dark:bg-meta-4 sm:py-7.5"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-0 opacity-0 outline-none"
                      onChange={handleImageUpload}
                    />
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
                        <Icon icon="bi:upload" />
                      </span>
                      <p>
                        <span className="text-primary">Click to upload</span> or
                        drag and drop
                      </p>
                      <p className="mt-1.5">SVG, PNG, JPG or GIF</p>
                      <p>(max, 800 X 800px)</p>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
