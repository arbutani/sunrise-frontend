'use client';

import { useToasts } from "@/components/helper/useToasts";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useRouter, useParams } from "next/navigation";
import React, { Fragment, useEffect, useState } from "react";
import { Button, Card, Col, Container, Form, FormControl, FormLabel, Row, Spinner } from "react-bootstrap";
import * as Yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { HandleError } from "@/lib/helper";
import Toaster from "@/components/helper/toaster";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setToken, clearToken } from "@/store/authSlice";
import { appTitle } from "@/helpers";
import { jwtDecode } from "jwt-decode";

const ReactSwal = withReactContent(Swal);
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
let isShowingSessionAlert = false;

class ApiClient {
  private baseURL: string;
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";
  }

  private async handleResponse(response: Response, onTokenExpired: () => Promise<void>) {
    if (response.status === 401) {
      await onTokenExpired();
      throw new Error("Session expired");
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  async get(url: string, token: string, onTokenExpired: () => Promise<void>) {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return this.handleResponse(response, onTokenExpired);
  }

  async put(url: string, data: any, token: string, onTokenExpired: () => Promise<void>) {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response, onTokenExpired);
  }
}

export const apiClient = new ApiClient();

const validateToken = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token);
    return decoded.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};

interface Subcategory {
  id?: string;
  name: string;
}

interface CategoryData {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

const CategoryUpdatePage = () => {
  const { toasts, addToast, removeToast } = useToasts();
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useParams();
  const token = useSelector((state: RootState) => state.auth.token);
  const [loading, setLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subcategoryInput, setSubcategoryInput] = useState("");
  const [existingSubcategories, setExistingSubcategories] = useState<Subcategory[]>([]);

  useEffect(() => {
    document.title = `${appTitle}Update Category`;
  }, []);

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Category Name is required"),
  });

  const { register, handleSubmit, formState, reset } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: { name: "" },
  });

  const { errors, isSubmitting } = formState;

  const handleTokenExpired = async () => {
    if (!isShowingSessionAlert) {
      isShowingSessionAlert = true;
      await Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Your session has expired. Please login again.",
        confirmButtonText: "OK",
        allowOutsideClick: false,
      });
      setTimeout(() => {
        isShowingSessionAlert = false;
      }, 1000);
    }
    dispatch(clearToken());
    localStorage.removeItem("user");
    router.push("/login");
  };

  useEffect(() => {
    const getCategoryId = () => {
      if (params?.id) return params.id as string;
      if (typeof window !== "undefined") {
        const segments = window.location.pathname.split("/");
        const idFromUrl = segments[segments.length - 1];
        if (idFromUrl && idFromUrl !== "category" && idFromUrl !== "update") return idFromUrl;
      }
      return null;
    };
    setCategoryId(getCategoryId());
  }, [params]);

  useEffect(() => {
    const checkAuth = () => {
      if (token && validateToken(token)) {
        setIsAuthChecking(false);
        return;
      }
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.token && validateToken(parsed.token)) {
            dispatch(setToken(parsed.token));
          }
        } catch {}
      }
      setIsAuthChecking(false);
    };
    checkAuth();
  }, [dispatch, token]);

  const fetchCategory = async (id: string) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/categories/${id}`, token!, handleTokenExpired);
      if (res.status && res.data) {
        const data: CategoryData = res.data;
        reset({ name: data.name || "" });
        let existingSubs: Subcategory[] = [];
        if (Array.isArray(data.subcategories)) {
          existingSubs = data.subcategories
            .map((sub: any) => ({ id: sub.id, name: sub.name }))
            .filter((sub: Subcategory) => sub.name);
        }
        setExistingSubcategories(existingSubs);
      } else {
        addToast(res.message || "Failed to fetch category data.", { toastClass: "bg-danger", delay: 3000 });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Session expired")) return;
      addToast(HandleError(error, router), { toastClass: "bg-danger", delay: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthChecking && categoryId && token) fetchCategory(categoryId);
  }, [isAuthChecking, categoryId, token]);

  const handleSubcategoryInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubcategoryInput(e.target.value);
  };

  const addSubcategory = () => {
    if (subcategoryInput.trim()) {
      const trimmedInput = subcategoryInput.trim();
      const isDuplicate = existingSubcategories.some(
        (sub) => sub.name.toLowerCase() === trimmedInput.toLowerCase()
      );
      if (isDuplicate) {
        addToast("Subcategory already exists!", { toastClass: "bg-warning", delay: 3000 });
        setSubcategoryInput("");
        return;
      }
      setExistingSubcategories((prev) => [...prev, { name: trimmedInput }]);
      setSubcategoryInput("");
    }
  };

  const removeSubcategory = (index: number) => {
    setExistingSubcategories((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: any) => {
    try {
      if (!categoryId) {
        addToast("Category ID not found", { toastClass: "bg-danger", delay: 3000 });
        return;
      }

      let finalSubcategories = [...existingSubcategories];

      if (subcategoryInput.trim()) {
        const trimmedInput = subcategoryInput.trim();
        const isDuplicate = finalSubcategories.some(
          (sub) => sub.name.toLowerCase() === trimmedInput.toLowerCase()
        );
        if (!isDuplicate) {
          finalSubcategories = [...finalSubcategories, { name: trimmedInput }];
          setExistingSubcategories(finalSubcategories);
        }
        setSubcategoryInput("");
      }

      const putData: any = { name: values.name };
      if (finalSubcategories.length > 0) {
        putData.subcategories = finalSubcategories.map((sub) => ({ name: sub.name }));
      }

      const res = await apiClient.put(`/categories/${categoryId}`, putData, token!, handleTokenExpired);
      if (res.status) {
        addToast(res.message || "Category updated successfully!", { toastClass: "bg-success", delay: 3000 });
        await ReactSwal.fire({
          title: "Success!",
          text: "Category updated successfully!",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#3085d6",
        });
        router.push("/categories");
      } else {
        addToast(res.message || "Update failed.", { toastClass: "bg-danger", delay: 3000 });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Session expired")) return;
      addToast(HandleError(error, router), { toastClass: "bg-danger", delay: 3000 });
    }
  };

  if (isAuthChecking || loading)
    return (
      <Container fluid className="px-2 px-sm-3">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="me-2" />
          {isAuthChecking ? "Checking authentication..." : "Loading category data..."}
        </div>
      </Container>
    );

  if (!categoryId)
    return (
      <Container fluid className="px-2 px-sm-3">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="me-2" />
          Loading category information...
        </div>
      </Container>
    );

  return (
    <Fragment>
      <Toaster toasts={toasts} addToast={addToast} removeToast={removeToast} />
      <Container fluid className="px-2 px-sm-3">
        <PageBreadcrumb title="Update Category" subtitle="Category List" subtitleLink="/categories" />
        <Row className="justify-content-center mt-3">
          <Col xs={12} lg={8} xl={6}>
            <Card>
              <Card.Header>
                <Card.Title as="h5">Update Category</Card.Title>
              </Card.Header>
              <Card.Body className="p-3 p-sm-4">
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Form.Group className="mb-3">
                    <FormLabel>
                      Category Name <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl
                      type="text"
                      {...register("name")}
                      placeholder="Enter category name"
                      isInvalid={!!errors.name}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.name?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <FormLabel>Add Subcategory</FormLabel>
                    <div className="d-flex gap-2 mb-2">
                      <FormControl
                        type="text"
                        value={subcategoryInput}
                        onChange={handleSubcategoryInput}
                        placeholder="Enter subcategory name"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSubcategory();
                          }
                        }}
                      />
                      <Button
                        variant="outline-primary"
                        onClick={addSubcategory}
                        type="button"
                        disabled={!subcategoryInput.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    <Form.Text className="text-muted">
                      Add subcategories one by one. You can also type and click "Update Category" - it will be
                      automatically added.
                    </Form.Text>
                  </Form.Group>

                  {existingSubcategories.length > 0 && (
                    <Form.Group className="mb-3">
                      <FormLabel>Subcategories:</FormLabel>
                      <div className="border rounded p-3">
                        {existingSubcategories.map((sub, index) => (
                          <div
                            key={index}
                            className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded"
                          >
                            <span>{sub.name}</span>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeSubcategory(index)}
                              type="button"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Form.Group>
                  )}

                  {subcategoryInput.trim() && (
                    <div className="alert alert-info mb-3">
                      <small>
                        <strong>Note:</strong> "{subcategoryInput}" will be automatically added when you click
                        "Update Category".
                      </small>
                    </div>
                  )}

                  <div className="d-grid mt-3">
                    <Button type="submit" disabled={isSubmitting} size="lg">
                      {isSubmitting ? "Updating Category..." : "Update Category"}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Fragment>
  );
};

export default CategoryUpdatePage;
