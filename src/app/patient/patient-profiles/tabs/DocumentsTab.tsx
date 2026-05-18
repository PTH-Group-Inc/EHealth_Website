import React, { useEffect, useState } from "react";
import { type PatientProfile } from "@/types/patient-profile";
import axiosClient from "@/api/axiosClient";
import { DOCUMENT_ENDPOINTS, DOCUMENT_TYPE_ENDPOINTS } from "@/api/endpoints";
import Modal from "@/components/common/Modal";
import { useToast } from "@/contexts/ToastContext";

interface TabProps {
    profile: PatientProfile;
}

export default function DocumentsTab({ profile }: TabProps) {
    const { showToast } = useToast();
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewingDoc, setViewingDoc] = useState<any>(null);

    const [fileName, setFileName] = useState("");
    const [fileType, setFileType] = useState("");
    const [documentTypes, setDocumentTypes] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const patientId = profile.id;
            if (!patientId) return;
            const res = await axiosClient.get(DOCUMENT_ENDPOINTS.LIST(patientId.toString()));
            const data = res.data?.data || res.data;
            setDocuments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching documents:", error);
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDocumentTypes = async () => {
        try {
            const res = await axiosClient.get(DOCUMENT_TYPE_ENDPOINTS.LIST);
            const data = res.data?.data || res.data;
            if (Array.isArray(data)) {
                setDocumentTypes(data);
                if (data.length > 0 && !fileType) {
                    setFileType(data[0].document_type_id);
                }
            }
        } catch (error) {
            console.error("Error fetching document types:", error);
        }
    };

    useEffect(() => {
        fetchDocuments();
        fetchDocumentTypes();
    }, [profile.id]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            if (!fileName) {
                setFileName(e.target.files[0].name);
            }
        }
    };

    const handleDelete = async (docId: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác.")) return;
        try {
            const patientId = profile.id;
            if (!patientId) return;
            await axiosClient.delete(DOCUMENT_ENDPOINTS.DELETE(patientId.toString(), docId));
            showToast("Đã xóa tài liệu thành công.", "success");
            fetchDocuments();
        } catch {
            showToast("Có lỗi xảy ra khi xóa tài liệu.", "error");
        }
    };

    const handleDownload = (doc: any) => {
        const url = doc.file_url || doc.url;
        if (url) {
            window.open(url, '_blank');
        } else {
            showToast("Không tìm thấy đường dẫn file.", "error");
        }
    };

    const handleView = (doc: any) => {
        const url = doc.file_url || doc.url;
        if (url) {
            setViewingDoc(doc);
        } else {
            showToast("Không tìm thấy đường dẫn file để xem.", "error");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            showToast("Vui lòng chọn file để tải lên.", "warning");
            return;
        }

        setSubmitting(true);
        try {
            const patientId = profile.id;
            if (!patientId) return;

            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("document_name", fileName);
            formData.append("document_type_id", fileType);
            formData.append("patient_id", patientId.toString());

            await axiosClient.post(DOCUMENT_ENDPOINTS.UPLOAD(patientId.toString()), formData);

            showToast("Tải tài liệu lên thành công!", "success");
            setFileName("");
            setFileType(documentTypes.length > 0 ? documentTypes[0].document_type_id : "");
            setSelectedFile(null);
            setIsAddModalOpen(false);

            await fetchDocuments();
        } catch {
            showToast("Có lỗi xảy ra, vui lòng thử lại sau.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Tài liệu y tế</h3>
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#3C81C6] text-white rounded-xl hover:bg-[#2b6cb0] transition-colors text-sm font-medium">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>upload</span>
                    Tải tài liệu lên
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : documents.length > 0 ? (
                <div className="bg-white dark:bg-[#13191f] rounded-2xl border border-gray-100 dark:border-[#2d353e] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-[#2d353e]">
                                <tr>
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Loại</th>
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Tên tài liệu</th>
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Phân loại</th>
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Ngày tải lên</th>
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Kích thước</th>
                                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#2d353e]">
                                {documents.map((doc: any, index: number) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-[#3C81C6] rounded-xl flex items-center justify-center">
                                                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                                                    {doc.type === 'PDF' || doc.documentType?.includes('PDF') ? 'picture_as_pdf' : doc.type === 'IMAGE' || doc.documentType?.includes('IMAGE') ? 'image' : 'description'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white max-w-[200px] truncate" title={doc.title || doc.name || doc.fileName}>
                                            {doc.title || doc.name || doc.fileName || "Tài liệu"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg">
                                                {doc.document_type_name || doc.documentType || doc.document_type || "Tài liệu y tế"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {(doc.uploaded_at || doc.createdAt) ? new Date(doc.uploaded_at || doc.createdAt).toLocaleDateString("vi-VN") : "Chưa rõ ngày"}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {(doc.file_size_bytes || doc.size) ? `${Math.round((doc.file_size_bytes || doc.size) / 1024)} KB` : "Kích thước không rõ"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => handleView(doc)} className="p-2 text-gray-500 hover:text-[#3C81C6] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors inline-flex" title="Xem tài liệu">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>visibility</span>
                                                </button>
                                                <button onClick={() => handleDownload(doc)} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors inline-flex" title="Tải về">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>download</span>
                                                </button>
                                                <button onClick={() => handleDelete(doc.patient_documents_id || doc.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors inline-flex" title="Xóa tài liệu">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-[#13191f] rounded-2xl p-12 text-center border border-dashed border-gray-300 dark:border-[#2d353e]">
                    <div className="w-20 h-20 bg-[#3C81C6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "40px" }}>cloud_upload</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Chưa có tài liệu</h4>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">Kết quả xét nghiệm, X-quang hoặc tài liệu y tế sẽ hiển thị tại đây.</p>
                </div>
            )}

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Tải Tài Liệu Lên"
                size="md"
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
                    <div className="flex flex-col items-center justify-center w-full">
                        <label htmlFor="fileUploadInput" className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all ${selectedFile ? 'border-[#3C81C6] bg-blue-50/50 dark:bg-[#3C81C6]/10' : 'border-gray-300 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-800'}`}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4 w-full">
                                <span className={`material-symbols-outlined mb-2 text-4xl transition-colors ${selectedFile ? 'text-[#3C81C6]' : 'text-gray-400'}`}>
                                    {selectedFile ? 'task' : 'cloud_upload'}
                                </span>
                                {selectedFile ? (
                                    <div className="flex flex-col items-center w-full">
                                        <p className="mb-1 text-sm font-semibold text-[#3C81C6] dark:text-blue-400 max-w-full truncate px-4">{selectedFile.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        <p className="mt-2 text-xs text-gray-400 hover:text-red-500 hover:underline" onClick={(e) => { e.preventDefault(); setSelectedFile(null); setFileName(""); }}>Thay đổi file</p>
                                    </div>
                                ) : (
                                    <>
                                        <p className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Nhấn để chọn file tài liệu</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Hỗ trợ PDF, JPG, PNG, DOCX (Max: 10MB)</p>
                                    </>
                                )}
                            </div>
                            <input
                                id="fileUploadInput"
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                                required={!selectedFile}
                            />
                        </label>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="fileName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tên tài liệu <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                <span className="material-symbols-outlined text-[18px]">edit_document</span>
                            </div>
                            <input
                                id="fileName"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                required
                                placeholder="Nhập tên mô tả cho tài liệu..."
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-[#3C81C6] focus:border-[#3C81C6] block w-full pl-10 p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-shadow shadow-sm hover:shadow-md focus:shadow-md"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="fileType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Phân loại tài liệu
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                <span className="material-symbols-outlined text-[18px]">category</span>
                            </div>
                            <select
                                id="fileType"
                                value={fileType}
                                onChange={(e) => setFileType(e.target.value)}
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-[#3C81C6] focus:border-[#3C81C6] block w-full pl-10 p-2.5 appearance-none dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-shadow shadow-sm hover:shadow-md focus:shadow-md"
                            >
                                {documentTypes.map(type => (
                                    <option key={type.document_type_id} value={type.document_type_id}>
                                        {type.name}
                                    </option>
                                ))}
                                {documentTypes.length === 0 && <option value="">Không có loại tài liệu</option>}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                                <span className="material-symbols-outlined">expand_more</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-2 pt-5 border-t border-gray-100 dark:border-gray-700/50">
                        <button 
                            type="button" 
                            onClick={() => setIsAddModalOpen(false)} 
                            disabled={submitting}
                            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium bg-white hover:bg-gray-50 hover:text-gray-900 transition-all focus:ring-4 focus:ring-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            type="submit" 
                            disabled={submitting || !selectedFile}
                            className="px-5 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-medium hover:bg-[#2b6cb0] hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-[#3C81C6]"
                        >
                            {submitting ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Đang xử lý...</>
                            ) : (
                                <><span className="material-symbols-outlined text-[18px]">publish</span> Xác nhận tải lên</>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={!!viewingDoc}
                onClose={() => setViewingDoc(null)}
                title={viewingDoc?.title || viewingDoc?.name || viewingDoc?.fileName || "Xem tài liệu"}
                size="xl"
            >
                <div className="w-full h-[75vh] bg-[#f8f9fa] dark:bg-[#0b0e14] rounded-xl overflow-hidden mt-2 flex items-center justify-center p-2 border border-gray-200 dark:border-gray-800">
                    {viewingDoc && (viewingDoc.file_url?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || viewingDoc.file_format?.includes('image')) ? (
                        <div className="w-full h-full relative flex items-center justify-center">
                            <img 
                                src={viewingDoc.file_url || viewingDoc.url} 
                                alt={viewingDoc?.title || 'Tài liệu'} 
                                className="w-full h-full object-contain rounded-lg drop-shadow-md"
                            />
                        </div>
                    ) : viewingDoc && (viewingDoc.file_url || viewingDoc.url) ? (
                        <div className="w-full h-full relative">
                            {/* Adding a loading fallback for iframe can be complex, so we just wrap it to ensure it takes up full space nicely */}
                            <iframe 
                                src={viewingDoc.file_url || viewingDoc.url}
                                className="w-full h-full border-0 rounded-lg shadow-sm"
                                title="Tài liệu"
                                loading="lazy"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-500">
                            <span className="material-symbols-outlined text-5xl mb-3 text-gray-300 dark:text-gray-600">broken_image</span>
                            <p className="font-medium">Định dạng file không được hỗ trợ hiển thị trực tiếp.</p>
                            <p className="text-sm mt-1">Vui lòng tải về máy để xem.</p>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 mt-4 pt-4">
                    <button 
                        type="button" 
                        onClick={() => setViewingDoc(null)} 
                        className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium bg-white hover:bg-gray-50 transition-colors focus:ring-4 focus:ring-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                    >
                        Đóng
                    </button>
                    <button 
                        type="button" 
                        onClick={() => handleDownload(viewingDoc)}
                        className="px-5 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-medium hover:bg-[#2b6cb0] hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">download</span> Tải về
                    </button>
                </div>
            </Modal>
        </div>
    );
}
