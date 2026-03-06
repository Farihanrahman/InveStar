/**
 * Orders Page
 * Displays user's orders from OMS API
 */

import { useState } from "react";
import { useOmsAuth } from "@/lib/auth/omsAuthContext";
import { useOrders } from "@/hooks/api/useOrderApi";
import type { Order } from "@/services/oms/orderService";
import { PageLayout, PageHeader } from "@/components/layout";
import AuthRequired from "@/components/AuthRequired";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Search, Filter, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case "NEW":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "FILLED":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "PARTIALLY_FILLED":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "CANCELLED":
    case "CANCELED":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "REJECTED":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "REPLACED":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "PENDING":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getSideColor = (side: string) => {
  return side.toUpperCase() === "BUY" 
    ? "bg-green-500/20 text-green-400 border-green-500/30"
    : "bg-red-500/20 text-red-400 border-red-500/30";
};

const Orders = () => {
  const { user } = useOmsAuth();
  const [searchSymbol, setSearchSymbol] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const clientCode = user?.clientCode || "";

  const { data: ordersResponse, isLoading, refetch, isFetching } = useOrders({
    client_code: clientCode,
    symbol: searchSymbol || undefined,
    filterByCurrentUser: false,
    page,
    size: pageSize,
    sort: "createdAt,desc",
  });

  // Extract orders array from the response
  const orders: Order[] = ordersResponse?.data || [];
  const totalPages = ordersResponse?.totalPages || 1;
  const totalRecords = ordersResponse?.totalRecords || 0;

  // Filter orders by status if selected
  const filteredOrders = statusFilter === "all" 
    ? orders 
    : orders.filter(order => order.status.toUpperCase() === statusFilter.toUpperCase());

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  return (
    <PageLayout>
      <AuthRequired>
        <div className="container mx-auto px-4 py-6 space-y-6">
          <PageHeader
            title="Orders"
            description="View and manage your trading orders"
          />

          {/* Filters */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by symbol..."
                    value={searchSymbol}
                    onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="FILLED">Filled</SelectItem>
                    <SelectItem value="PARTIALLY_FILLED">Partially Filled</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="REPLACED">Replaced</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isFetching}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Orders Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRecords}</div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Open Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">
                  {orders.filter(o => o.status === "NEW").length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Filled Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  {orders.filter(o => o.status === "FILLED").length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cancelled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">
                  {orders.filter(o => o.status === "CANCELLED" || o.status === "CANCELED").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Table */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Order History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No orders found</p>
                  {searchSymbol && (
                    <p className="text-sm mt-2">Try adjusting your search filters</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Side</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Filled</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Order ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="whitespace-nowrap">
                              {formatDate(order.createdAt)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {order.symbol}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getSideColor(order.side)}>
                                {order.side}
                              </Badge>
                            </TableCell>
                            <TableCell>{order.type}</TableCell>
                            <TableCell className="text-right font-mono">
                              {order.quantity.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ৳{order.price.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {order.fillQuantity.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">
                              {order.clientOrderId.slice(0, 10)}...
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                      <p className="text-sm text-muted-foreground">
                        Page {page + 1} of {totalPages} ({totalRecords} total orders)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(0, p - 1))}
                          disabled={page === 0}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={page >= totalPages - 1}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </AuthRequired>
    </PageLayout>
  );
};

export default Orders;
