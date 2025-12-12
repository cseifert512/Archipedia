import { useState } from "react";
import { DataQualityIndicator } from "../components/DataQualityIndicator";
import { ContributionModal } from "../components/ContributionModal";
import { AdvancedSearchBar } from "../components/AdvancedSearchBar";
import { Footer } from "../components/Footer";
import { 
  ArrowLeft, 
  Bookmark, 
  Share2, 
  ChevronLeft, 
  ChevronRight,
  Download,
  MapPin,
  Calendar,
  Ruler,
  Layers,
  Award,
  FileText,
  Image as ImageIcon,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Building,
  Box
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { mockProjects } from "../lib/mockData";
import { LensFrame } from "../components/LensFrame";

const projectImages = [
  { url: "https://images.unsplash.com/photo-1758611228434-7b5b697abd0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", caption: "Main entrance", credit: "Photo: Iwan Baan", type: "Exterior view" },
  { url: "https://images.unsplash.com/photo-1724878019526-91926d24add4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", caption: "Classroom interior", credit: "Photo: Iwan Baan", type: "Interior view" },
  { url: "https://images.unsplash.com/photo-1543364972-12a04a63ce01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", caption: "Central courtyard", credit: "Photo: Iwan Baan", type: "Exterior view" },
  { url: "https://images.unsplash.com/photo-1692719224629-317d0bd533f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", caption: "Facade detail", credit: "Photo: Iwan Baan", type: "Detail" },
  { url: "https://images.unsplash.com/photo-1598897270268-f7091c801c3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", caption: "Stairwell", credit: "Photo: Iwan Baan", type: "Interior view" },
  { url: "https://images.unsplash.com/photo-1610650394144-a778795cf585?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", caption: "Library space", credit: "Photo: Iwan Baan", type: "Interior view" },
];

export function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id || "1";
  const project = mockProjects.find(p => p.id === projectId) || mockProjects[0];
  const [, setLocation] = useLocation();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  const completeness = 67;
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % projectImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + projectImages.length) % projectImages.length);
  };

  const currentImage = projectImages[currentImageIndex];

  const sections = [
    { id: "overview", label: "Overview", complete: true },
    { id: "visual", label: "Visual Documentation", complete: "partial" },
    { id: "materials", label: "Materials & Systems", complete: true },
    { id: "team", label: "Project Team", complete: true },
    { id: "construction", label: "Construction Details", complete: "partial" },
    { id: "comparative", label: "Comparative Analysis", complete: false },
  ];

  const handleSearch = (query: string, image: string | null | undefined) => {
    if (query.trim() || image) {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query);
      if (image) params.set('type', 'image');
      setLocation(`/results?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] relative overflow-hidden flex flex-col">
      
      {/* Search Bar Header */}
      <header 
        className="fixed top-0 left-0 right-0 flex justify-center"
        style={{
          padding: "0",
          paddingTop: "16px",
          zIndex: 50,
        }}
      >
        <div 
          style={{
            width: "75%",
            maxWidth: "75%",
            overflow: "hidden",
          }}
        >
          <AdvancedSearchBar
            onSearch={handleSearch}
            showImageUpload={true}
          />
        </div>
      </header>

      {/* Main Content - All within same margins */}
      <main className="flex-1" style={{ paddingTop: "120px" }}>
        <div 
          style={{
            width: "75%",
            maxWidth: "75%",
            margin: "0 auto",
          }}
        >
          {/* Data Completeness Banner */}
          <div style={{ marginBottom: "32px" }}>
            <div className="rounded-xl overflow-hidden" style={{
              backgroundColor: "rgba(255,255,255,0.8)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(0,0,0,0.1)"
            }}>
              <div style={{ padding: "32px 48px" }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-6">
                      <div className="flex-1 max-w-[400px]">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[16px] font-medium" style={{ fontFamily: "var(--font-primary)" }}>Project documentation:</span>
                          <span className="text-[16px] font-bold" style={{ fontFamily: "var(--font-primary)", color: "#000000" }}>{completeness}% complete</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all duration-500"
                            style={{ 
                              width: `${completeness}%`,
                              backgroundColor: "var(--accent)"
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 text-[13px]">
                        <span className="px-4 py-2 rounded-full flex items-center gap-2" style={{ 
                          fontFamily: "var(--font-primary)",
                          backgroundColor: "rgba(0,0,0,0.05)"
                        }}>
                          <CheckCircle size={14} />
                          Verified
                        </span>
                        <span className="px-4 py-2 rounded-full flex items-center gap-2" style={{ 
                          fontFamily: "var(--font-primary)",
                          backgroundColor: "rgba(0,0,0,0.05)"
                        }}>
                          <Users size={14} />
                          Community
                        </span>
                        <span className="px-4 py-2 rounded-full flex items-center gap-2" style={{ 
                          fontFamily: "var(--font-primary)",
                          backgroundColor: "rgba(0,0,0,0.05)"
                        }}>
                          <Clock size={14} />
                          Pending
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsContributionModalOpen(true)}
                    className="rounded-lg text-[16px] font-medium transition-all flex items-center gap-2"
                    style={{
                      fontFamily: "var(--font-primary)",
                      backgroundColor: "transparent",
                      border: "1px solid rgba(0,0,0,0.3)",
                      color: "#000000",
                      padding: "16px 32px"
                    }}
                  >
                    <Plus size={18} />
                    Help complete this project
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[13px] mt-3 flex items-center gap-2" style={{ 
              fontFamily: "var(--font-primary)",
              color: "rgba(0,0,0,0.5)",
              paddingLeft: "48px"
            }}>
              <span>Last updated: March 2025</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users size={14} />
                47 contributors
              </span>
            </p>
          </div>

          {/* Hero Image Carousel */}
          <section style={{ marginBottom: "40px" }}>
            <LensFrame className="rounded-2xl overflow-hidden" style={{ height: "720px" }}>
              <div className="relative h-[600px]">
                <ImageWithFallback
                  src={currentImage.url}
                  alt={currentImage.caption}
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute rounded-xl" style={{
                  bottom: "24px",
                  left: "24px",
                  background: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(12px)",
                  padding: "16px 24px"
                }}>
                  <p className="text-white text-[14px] mb-1" style={{ fontFamily: "var(--font-primary)" }}>{currentImage.credit}</p>
                  <p className="text-white/80 text-[13px]" style={{ fontFamily: "var(--font-primary)" }}>{currentImage.type}</p>
                </div>

                <div className="absolute rounded-full" style={{
                  bottom: "24px",
                  right: "24px",
                  backgroundColor: "rgba(255,255,255,0.8)",
                  backdropFilter: "blur(12px)",
                  padding: "12px 20px"
                }}>
                  <p className="text-[14px] font-medium" style={{ fontFamily: "var(--font-primary)" }}>{currentImageIndex + 1} / {projectImages.length}</p>
                </div>

                <button
                  onClick={prevImage}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.8)",
                    backdropFilter: "blur(12px)"
                  }}
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.8)",
                    backdropFilter: "blur(12px)"
                  }}
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="h-[120px] px-6 py-4 flex gap-3 overflow-x-auto">
                {projectImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-[140px] h-[90px] rounded-lg overflow-hidden transition-all ${
                      idx === currentImageIndex ? "ring-2 scale-105" : "opacity-60 hover:opacity-100"
                    }`}
                    style={{
                      ringColor: idx === currentImageIndex ? "#000000" : "transparent"
                    }}
                  >
                    <ImageWithFallback src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </LensFrame>
          </section>

          {/* Project Header Bar */}
          <section style={{ marginBottom: "40px" }}>
            <div className="rounded-2xl overflow-hidden" style={{
              backgroundColor: "rgba(255,255,255,0.8)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(0,0,0,0.1)"
            }}>
              <div style={{ padding: "40px 48px" }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 rounded-full text-[14px]" style={{
                      fontFamily: "var(--font-primary)",
                      backgroundColor: "rgba(0,0,0,0.05)",
                      color: "rgba(0,0,0,0.6)",
                      padding: "8px 16px",
                      marginBottom: "16px"
                    }}>
                      <Link href="/results" className="hover:text-[#000000]">Search Results</Link>
                      <span>›</span>
                      <span style={{ color: "#000000" }}>{project.name}</span>
                    </div>
                    
                    <h1 className="text-[36px] font-bold mb-3" style={{ 
                      fontFamily: "var(--font-primary)",
                      color: "#000000"
                    }}>
                      {project.name}
                    </h1>
                    <a href="#" className="text-[18px] font-medium hover:underline mb-4 inline-block" style={{
                      fontFamily: "var(--font-primary)",
                      color: "#000000"
                    }}>
                      {project.architect}
                    </a>
                    
                    <div className="flex items-center gap-6 text-[16px]" style={{ 
                      fontFamily: "var(--font-primary)",
                      color: "rgba(0,0,0,0.6)"
                    }}>
                      <div className="flex items-center gap-2">
                        <MapPin size={18} />
                        <span>{project.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={18} />
                        <span>{project.year}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <button className="rounded-lg text-[16px] font-medium transition-all" style={{
                      fontFamily: "var(--font-primary)",
                      backgroundColor: "transparent",
                      border: "1px solid rgba(0,0,0,0.3)",
                      color: "#000000",
                      padding: "16px 32px"
                    }}>
                      View all drawings
                    </button>
                    <button className="rounded-lg text-[16px] font-medium transition-all flex items-center justify-center gap-2" style={{
                      fontFamily: "var(--font-primary)",
                      backgroundColor: "transparent",
                      border: "1px solid rgba(0,0,0,0.3)",
                      color: "rgba(0,0,0,0.6)",
                      padding: "16px 32px"
                    }}>
                      <Download size={18} />
                      Download info
                    </button>
                    <div className="flex gap-3" style={{ width: "100%", justifyContent: "center" }}>
                      <button
                        onClick={() => setIsBookmarked(!isBookmarked)}
                        className="rounded-lg transition-all"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.8)",
                          backdropFilter: "blur(12px)",
                          padding: "12px"
                        }}
                      >
                        <Bookmark size={20} className={isBookmarked ? "fill-[#000000] text-[#000000]" : ""} />
                      </button>
                      <button className="rounded-lg transition-all" style={{
                        backgroundColor: "rgba(255,255,255,0.8)",
                        backdropFilter: "blur(12px)",
                        padding: "12px"
                      }}>
                        <Share2 size={20} />
                      </button>
                      <Link href="/results">
                        <button className="rounded-lg transition-all" style={{
                          backgroundColor: "rgba(255,255,255,0.8)",
                          backdropFilter: "blur(12px)",
                          padding: "12px"
                        }}>
                          <ArrowLeft size={20} />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Three-Column Layout */}
          <div className="flex gap-10 items-start" style={{ marginBottom: "60px" }}>
            {/* Left Sidebar - TOC & Data Quality */}
            <aside className="w-[320px] flex flex-col gap-10">
              {/* Table of Contents */}
              <div className="rounded-2xl overflow-hidden" style={{
                backgroundColor: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(0,0,0,0.1)"
              }}>
                <div style={{ padding: "32px" }}>
                  <h3 className="text-[18px] font-semibold mb-10" style={{ fontFamily: "var(--font-primary)" }}>Contents</h3>
                  <nav className="space-y-3">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 rounded-lg text-[14px] transition-all ${
                          activeSection === section.id ? "bg-[rgba(0,0,0,0.05)]" : "hover:bg-[rgba(255,255,255,0.5)]"
                        }`}
                        style={{ 
                          fontFamily: "var(--font-primary)",
                          padding: "12px 16px"
                        }}
                      >
                        {section.complete === true && <CheckCircle size={14} style={{ color: "var(--accent)" }} />}
                        {section.complete === "partial" && <AlertCircle size={14} style={{ color: "#FF9500" }} />}
                        {section.complete === false && <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />}
                        <span className="flex-1 text-left">{section.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Data Sources */}
              <div className="rounded-2xl overflow-hidden" style={{
                backgroundColor: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(0,0,0,0.1)"
              }}>
                <div style={{ padding: "32px" }}>
                  <h3 className="text-[16px] font-semibold mb-10" style={{ fontFamily: "var(--font-primary)" }}>Information Sources</h3>
                  <div className="space-y-3 mb-8">
                    {[
                      { icon: CheckCircle, label: "Architect verified", color: "#000000" },
                      { icon: FileText, label: "Published in 3 sources", color: "var(--accent)" },
                      { icon: Building, label: "Public records", color: "rgba(0,0,0,0.6)" },
                      { icon: Users, label: "12 community contributors", color: "#FF9500" },
                      { icon: Clock, label: "Post-occupancy study pending", color: "#FF9500" },
                    ].map((source, idx) => (
                      <div key={idx} className="rounded-lg flex items-center gap-3" style={{
                        backgroundColor: "rgba(255,255,255,0.8)",
                        backdropFilter: "blur(12px)",
                        padding: "12px 16px"
                      }}>
                        <source.icon size={18} style={{ color: source.color }} />
                        <span className="text-[14px]" style={{ fontFamily: "var(--font-primary)" }}>{source.label}</span>
                      </div>
                    ))}
                  </div>
                  <a href="#" className="text-[14px] hover:underline block" style={{ 
                    fontFamily: "var(--font-primary)",
                    color: "#000000"
                  }}>View all sources</a>
                </div>
              </div>
            </aside>

            {/* Main Content Column */}
            <div className="flex-1 flex flex-col gap-10">
              {/* Project Overview */}
              <section id="overview">
                <div className="rounded-2xl overflow-hidden" style={{
                  backgroundColor: "rgba(255,255,255,0.8)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(0,0,0,0.1)"
                }}>
                  <div style={{ padding: "40px" }}>
                    <h2 className="text-[24px] font-semibold mb-5" style={{ fontFamily: "var(--font-primary)" }}>Project Overview</h2>
                    <div className="h-px bg-gradient-to-r from-[rgba(0,0,0,0.1)] to-transparent mb-8"></div>
                    
                    <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                      {[
                        { label: "Location", value: "Manhattan, New York, NY, USA", status: "verified", source: "Public records, verified 2024" },
                        { label: "Status", value: <span className="inline-block rounded-full text-[14px]" style={{ 
                          backgroundColor: "rgba(0,255,0,0.1)",
                          color: "var(--accent)",
                          fontFamily: "var(--font-primary)",
                          padding: "8px 16px"
                        }}>Built</span>, status: "verified" },
                        { label: "Completion Year", value: project.year, status: "verified", source: "Architect verified" },
                        { label: "Budget", value: "$12.5M USD", status: "sourced", source: "Architectural Record, May 2024" },
                        { label: "Project Type", value: project.buildingType, status: "verified" },
                        { label: "Climate Zone", value: "Humid Subtropical", status: "verified" },
                        { label: "Site Area", value: "2,400 m² (25,833 sq ft)", status: "sourced", source: "Public permit records" },
                        { label: "Certification", value: <span className="inline-block rounded-full text-[14px]" style={{ 
                          backgroundColor: "rgba(0,255,0,0.1)",
                          color: "var(--accent)",
                          fontFamily: "var(--font-primary)",
                          padding: "8px 16px"
                        }}>LEED Gold</span>, status: "verified" },
                        { label: "Building Area", value: "3,200 m² (34,445 sq ft)", status: "sourced", source: "Public permit records" },
                        { label: "Floors", value: "4 stories + basement", status: "verified" },
                      ].map((item, idx) => (
                        <div key={idx}>
                          <div className="flex items-center gap-2 mb-3">
                            <p className="text-[15px] font-medium" style={{ 
                              fontFamily: "var(--font-primary)",
                              color: "rgba(0,0,0,0.6)"
                            }}>{item.label}</p>
                            <DataQualityIndicator type={item.status as any} source={item.source} />
                          </div>
                          <div className="text-[16px]" style={{ 
                            fontFamily: "var(--font-primary)",
                            color: "#000000"
                          }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Data Quality Score */}
              <div className="rounded-2xl overflow-hidden" style={{
                backgroundColor: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(0,0,0,0.1)"
              }}>
                <div style={{ padding: "40px" }}>
                  <h3 className="text-[18px] font-semibold mb-10" style={{ fontFamily: "var(--font-primary)" }}>Data Quality Score</h3>
                  <div className="flex items-center gap-12">
                    {/* Left: Circular dial */}
                    <div className="flex justify-center">
                      <div className="relative w-32 h-32">
                        <svg className="transform -rotate-90" width="128" height="128">
                          <circle cx="64" cy="64" r="54" fill="none" stroke="#E0E0E0" strokeWidth="10" />
                          <circle 
                            cx="64" 
                            cy="64" 
                            r="54" 
                            fill="none" 
                            stroke="#FF9500" 
                            strokeWidth="10"
                            strokeDasharray={`${2 * Math.PI * 54}`}
                            strokeDashoffset={`${2 * Math.PI * 54 * (1 - completeness / 100)}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[32px] font-bold" style={{ 
                            fontFamily: "var(--font-primary)",
                            color: "#FF9500"
                          }}>{completeness}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right: Percentages */}
                    <div className="flex-1 space-y-3 text-[14px]" style={{ fontFamily: "var(--font-primary)" }}>
                      <div className="flex justify-between items-center">
                        <span>Basic info:</span>
                        <span className="font-medium">100%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Drawings:</span>
                        <span className="font-medium">80%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Technical:</span>
                        <span className="font-medium">45%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Performance:</span>
                        <span className="font-medium">20%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Financial:</span>
                        <span className="font-medium">60%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <aside className="w-[320px] flex flex-col gap-10">
              {/* Quick Facts */}
              <div className="rounded-2xl overflow-hidden" style={{
                backgroundColor: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(0,0,0,0.1)"
              }}>
                <div style={{ padding: "32px" }}>
                  <h3 className="text-[18px] font-semibold mb-10" style={{ fontFamily: "var(--font-primary)" }}>Quick Facts</h3>
                  <div className="space-y-5">
                    {[
                      { icon: <Building size={22} />, text: "Educational Building" },
                      { icon: <Calendar size={22} />, text: `Completed ${project.year}` },
                      { icon: <Ruler size={22} />, text: "3,200 m²" },
                      { icon: <Layers size={22} />, text: "4 stories" },
                      { icon: <MapPin size={22} />, text: project.location },
                      { icon: <Award size={22} />, text: "3 awards" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{
                          backgroundColor: "rgba(255,255,255,0.8)",
                          backdropFilter: "blur(12px)"
                        }}>
                          {item.icon}
                        </div>
                        <span className="text-[15px]" style={{ fontFamily: "var(--font-primary)" }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Downloads */}
              <div className="rounded-2xl overflow-hidden" style={{
                backgroundColor: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(0,0,0,0.1)"
              }}>
                <div style={{ padding: "32px" }}>
                  <h3 className="text-[18px] font-semibold mb-10" style={{ fontFamily: "var(--font-primary)" }}>Resources</h3>
                  <div className="space-y-3">
                    {[
                      { icon: <FileText size={18} />, text: "Project info PDF", available: true },
                      { icon: <ImageIcon size={18} />, text: "High-res images (24)", available: true },
                      { icon: <Layers size={18} />, text: "Drawing set", available: true },
                      { icon: <Box size={18} />, text: "3D Models", available: true },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        className="w-full rounded-lg flex items-center justify-center gap-3 text-[15px] transition-all"
                        style={{
                          fontFamily: "var(--font-primary)",
                          backgroundColor: "rgba(255,255,255,0.8)",
                          backdropFilter: "blur(12px)",
                          padding: "16px",
                          color: "#000000"
                        }}
                      >
                        {item.icon}
                        {item.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Similar Projects - Full Width */}
          <section style={{ marginBottom: "60px" }}>
            <div className="rounded-2xl overflow-hidden" style={{
              backgroundColor: "rgba(255,255,255,0.8)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(0,0,0,0.1)"
            }}>
              <div style={{ padding: "48px" }}>
                <h3 className="text-[24px] font-semibold mb-10" style={{ fontFamily: "var(--font-primary)" }}>Similar Projects</h3>
                <div className="grid grid-cols-3 gap-10">
                  {mockProjects.slice(1, 4).map((relatedProject) => (
                    <Link key={relatedProject.id} href={`/project/${relatedProject.id}`}>
                      <div className="rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02]" style={{
                        backgroundColor: "rgba(255,255,255,0.8)",
                        backdropFilter: "blur(12px)"
                      }}>
                        <ImageWithFallback
                          src={relatedProject.imageUrl}
                          alt={relatedProject.name}
                          className="w-full h-[200px] object-cover"
                        />
                        <div style={{ padding: "24px" }}>
                          <h4 className="text-[16px] font-semibold mb-2" style={{ 
                            fontFamily: "var(--font-primary)",
                            lineHeight: "1.4"
                          }}>{relatedProject.name}</h4>
                          <p className="text-[14px] mb-3" style={{ 
                            fontFamily: "var(--font-primary)",
                            color: "rgba(0,0,0,0.6)"
                          }}>{relatedProject.architect}</p>
                          <span className="inline-block rounded-full text-[13px]" style={{
                            fontFamily: "var(--font-primary)",
                            backgroundColor: "rgba(0,0,0,0.05)",
                            color: "#000000",
                            padding: "6px 12px"
                          }}>
                            {relatedProject.matchPercentage}% Match
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer - Within same margins */}
      <Footer variant="minimal" logoLink="/" />

      <ContributionModal
        isOpen={isContributionModalOpen}
        onClose={() => setIsContributionModalOpen(false)}
        projectName={project.name}
      />
    </div>
  );
}